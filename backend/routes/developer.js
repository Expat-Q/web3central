const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const DeveloperProfile = require('../models/DeveloperProfile');
const Tool = require('../models/Tool');
const Rating = require('../models/Rating');
const { protect } = require('../middleware/auth');

/* ────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────── */
const makeVerificationCode = (toolId) =>
  `W3C-CLAIM-${toolId}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const makePubCode = (appName) =>
  `W3C-PUB-${appName.replace(/\s+/g, '-').toUpperCase().slice(0, 12)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/* ────────────────────────────────────────────────────────
   HELPER: Verify on-chain tx via Etherscan
   Returns { ok: true } or { ok: false, reason: string }
──────────────────────────────────────────────────────── */
const verifyEtherscanTx = async (txHash, expectedCode, expectedValueEth = 0.001) => {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    const vaultAddr = (process.env.W3C_VAULT_ADDRESS || '').toLowerCase();

    if (!apiKey) return { ok: false, reason: 'Etherscan API not configured.' };
    if (!vaultAddr) return { ok: false, reason: 'Vault address not configured.' };

    let txData;
    try {
        const url = `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`;
        const r = await fetch(url);
        txData = await r.json();
    } catch {
        return { ok: false, reason: 'Could not reach Etherscan API.' };
    }

    const tx = txData?.result;
    if (!tx || tx === null) return { ok: false, reason: 'Transaction not found. Make sure it is confirmed on-chain.' };

    // 1. Recipient must be the vault
    if ((tx.to || '').toLowerCase() !== vaultAddr) {
        return { ok: false, reason: `Transaction must be sent to the web3central vault address.` };
    }

    // 2. Value must be >= listing fee
    const valueEth = parseInt(tx.value, 16) / 1e18;
    if (valueEth < expectedValueEth) {
        return { ok: false, reason: `Transaction value (${valueEth.toFixed(4)} ETH) is less than the required ${expectedValueEth} ETH.` };
    }

    // 3. Input data must contain the verification code
    const inputHex = tx.input || '';
    const inputText = Buffer.from(inputHex.replace(/^0x/, ''), 'hex').toString('utf8').replace(/\0/g, '');
    if (!inputText.includes(expectedCode)) {
        return { ok: false, reason: `Verification code "${expectedCode}" not found in transaction data.` };
    }

    // 4. Must be confirmed (blockNumber exists)
    if (!tx.blockNumber) {
        return { ok: false, reason: 'Transaction is still pending. Please wait for it to be confirmed.' };
    }

    return { ok: true, from: tx.from, valueEth };
};



/* ────────────────────────────────────────────────────────
   GET /api/developer/profile
   Returns current developer profile (or null)
──────────────────────────────────────────────────────── */
router.get('/profile', protect, async (req, res) => {
    try {
        const profile = await DeveloperProfile.findOne({ user: req.user.id }).lean();
        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ────────────────────────────────────────────────────────
   POST /api/developer/register
   Step 1–3 of onboarding: create developer profile
──────────────────────────────────────────────────────── */
router.post('/register', protect, async (req, res) => {
    try {
        const existing = await DeveloperProfile.findOne({ user: req.user.id });
        if (existing) return res.json({ success: true, profile: existing, alreadyRegistered: true });

        const { displayName, bio, builderType, twitter, github, website, walletAddress, agreedToTerms } = req.body;

        if (!displayName?.trim()) return res.status(400).json({ error: 'Display name is required.' });
        if (!agreedToTerms) return res.status(400).json({ error: 'You must agree to the Developer Terms.' });

        const hasSocialProof = twitter || github || website;
        if (!hasSocialProof) return res.status(400).json({ error: 'At least one social proof link is required (Twitter, GitHub, or website).' });

        const profile = await DeveloperProfile.create({
            user: req.user.id,
            displayName: displayName.trim(),
            bio: bio?.trim() || '',
            builderType: builderType || 'solo',
            twitter: twitter?.trim() || '',
            github: github?.trim() || '',
            website: website?.trim() || '',
            walletAddress: walletAddress?.trim() || '',
            agreedToTermsAt: new Date(),
            tier: 'basic'
        });

        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ────────────────────────────────────────────────────────
   GET /api/developer/dashboard
   My apps + their ratings summary
──────────────────────────────────────────────────────── */
router.get('/dashboard', protect, async (req, res) => {
    try {
        const profile = await DeveloperProfile.findOne({ user: req.user.id });
        if (!profile) return res.json({ success: true, tools: [], ratings: [], profile: null });

        const tools = await Tool.find({
            $or: [
                { submitter: req.user.id },
                { developerClaimedBy: req.user.id }
            ]
        }).lean();

        const toolIds = tools.map(t => t.id);

        const ratings = await Rating.find({ tool: { $in: toolIds } })
            .populate('user', 'name avatarUrl')
            .sort({ createdAt: -1 })
            .lean();

        // Enrich each tool with rating summary
        const enrichedTools = tools.map(tool => {
            const toolRatings = ratings.filter(r => r.tool === tool.id);
            const avg = toolRatings.length
                ? parseFloat((toolRatings.reduce((s, r) => s + r.score, 0) / toolRatings.length).toFixed(1))
                : null;
            return {
                ...tool,
                ratingCount: toolRatings.length,
                averageRating: avg,
                unansweredReviews: toolRatings.filter(r => r.comment && !r.developerReply).length
            };
        });

        // Platform-wide totals
        const totalLaunches = tools.reduce((s, t) => s + (t.clickCount || 0), 0);
        const totalReviews = ratings.length;
        const totalUnanswered = enrichedTools.reduce((s, t) => s + t.unansweredReviews, 0);

        res.json({
            success: true,
            profile,
            tools: enrichedTools,
            ratings,
            summary: { totalLaunches, totalReviews, totalUnanswered }
        });
    } catch (err) {
        console.error('Developer dashboard error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ────────────────────────────────────────────────────────
   POST /api/developer/claim/initiate
   Generates a verification code and stores it in pendingClaims
──────────────────────────────────────────────────────── */
router.post('/claim/initiate', protect, async (req, res) => {
    try {
        const { toolId } = req.body;
        if (!toolId) return res.status(400).json({ error: 'toolId is required.' });

        const profile = await DeveloperProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(403).json({ error: 'You must complete developer registration first.' });

        const tool = await Tool.findOne({ id: toolId });
        if (!tool) return res.status(404).json({ error: 'App not found.' });
        if (tool.developerClaimedBy) return res.status(400).json({ error: 'This app is already claimed.' });

        // Check no active pending claim for this tool
        const existingClaim = profile.pendingClaims.find(
            c => c.toolId === toolId && c.status === 'pending' && new Date(c.expiresAt) > new Date()
        );
        if (existingClaim) return res.json({ success: true, claim: existingClaim, existing: true });

        const code = makeVerificationCode(toolId);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        profile.pendingClaims.push({
            toolId,
            toolName: tool.name,
            verificationCode: code,
            method: 'twitter',
            expiresAt,
            status: 'pending'
        });
        await profile.save();

        const claim = profile.pendingClaims[profile.pendingClaims.length - 1];

        res.json({
            success: true,
            claim,
            tweetTemplate: `Claiming @_web3central listing for ${tool.name}. ${code}`,
            instructions: [
                `Post the tweet below from the official @${tool.twitterHandle || tool.name.toLowerCase()} Twitter account.`,
                `Paste the tweet URL here to complete verification.`,
                `The code expires in 24 hours.`
            ]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ────────────────────────────────────────────────────────
   POST /api/developer/claim/verify-twitter
   Checks the tweet URL contains the correct code
──────────────────────────────────────────────────────── */
router.post('/claim/verify-twitter', protect, async (req, res) => {
    try {
        const { toolId, tweetUrl } = req.body;
        if (!toolId || !tweetUrl) return res.status(400).json({ error: 'toolId and tweetUrl are required.' });

        // Validate URL format first
        const isValidTweetUrl = /^https?:\/\/(twitter\.com|x\.com)\/.+\/status\/\d+/.test(tweetUrl);
        if (!isValidTweetUrl) return res.status(400).json({ error: 'Invalid tweet URL. Must link to a tweet on twitter.com or x.com' });

        const profile = await DeveloperProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(403).json({ error: 'Developer profile not found.' });

        const claimIdx = profile.pendingClaims.findIndex(
            c => c.toolId === toolId && c.status === 'pending' && new Date(c.expiresAt) > new Date()
        );
        if (claimIdx === -1) return res.status(404).json({ error: 'No active claim found for this app. Please initiate a new claim.' });

        const claim = profile.pendingClaims[claimIdx];
        const tool = await Tool.findOne({ id: toolId });

        // ── Auto-verify via Twitter API v2 ──────────────────────────────
        const bearerToken = process.env.TWITTER_BEARER_TOKEN;
        if (bearerToken) {
            const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];
            if (!tweetId) return res.status(400).json({ error: 'Could not extract tweet ID from URL.' });

            let tweetData;
            try {
                const twitterRes = await fetch(
                    `https://api.twitter.com/2/tweets/${tweetId}?expansions=author_id&user.fields=username&tweet.fields=created_at,text`,
                    { headers: { Authorization: `Bearer ${bearerToken}` } }
                );
                tweetData = await twitterRes.json();
            } catch {
                return res.status(502).json({ error: 'Could not reach Twitter API. Please try again.' });
            }

            if (tweetData.errors || !tweetData.data) {
                return res.status(404).json({ error: 'Tweet not found. Make sure the tweet is public and the URL is correct.' });
            }

            const tweetText = tweetData.data.text || '';
            const authorUsername = (tweetData.includes?.users?.[0]?.username || '').toLowerCase();
            const tweetCreatedAt = new Date(tweetData.data.created_at);

            // 1. Code check
            if (!tweetText.includes(claim.verificationCode)) {
                return res.status(400).json({
                    error: `Verification code not found in tweet. The tweet must contain exactly: ${claim.verificationCode}`
                });
            }

            // 2. Author handle check
            const expectedHandle = (tool?.twitterHandle || '').toLowerCase().replace(/^@/, '');
            if (expectedHandle && authorUsername !== expectedHandle) {
                return res.status(400).json({
                    error: `Tweet must be posted from the official account (@${expectedHandle}), but got @${authorUsername}.`
                });
            }

            // 3. Recency check (24h)
            const ageMs = Date.now() - tweetCreatedAt.getTime();
            if (ageMs > 24 * 60 * 60 * 1000) {
                return res.status(400).json({ error: 'Tweet is older than 24 hours. Please post a new tweet and try again.' });
            }

            // ── ALL CHECKS PASSED: Auto-approve ─────────────────────────
            profile.pendingClaims[claimIdx].status = 'approved';
            profile.pendingClaims[claimIdx].tweetUrl = tweetUrl;
            if (profile.tier === 'basic') profile.tier = 'claimed';
            await profile.save();

            await Tool.findOneAndUpdate(
                { id: toolId },
                {
                    developerClaimedBy: profile.user,
                    developerClaimPending: false,
                    claimVerificationMethod: 'twitter',
                    claimVerifiedAt: new Date()
                }
            );

            return res.json({
                success: true,
                autoApproved: true,
                message: `✅ Claim approved! ${tool?.name || toolId} is now in your console.`
            });
        }

        // ── Fallback: no bearer token configured → queue for admin review ──
        profile.pendingClaims[claimIdx].tweetUrl = tweetUrl;
        await Tool.findOneAndUpdate({ id: toolId }, { developerClaimPending: true });
        await profile.save();

        res.json({
            success: true,
            autoApproved: false,
            message: 'Tweet submitted for review. Our team will verify within 24 hours.',
            status: 'pending_review'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


/* ────────────────────────────────────────────────────────
   PUT /api/developer/profile
   Update developer profile (name, bio, social links)
──────────────────────────────────────────────────────── */
router.put('/profile', protect, async (req, res) => {
    try {
        const { displayName, bio, twitter, github, website, walletAddress } = req.body;
        const profile = await DeveloperProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ error: 'Developer profile not found.' });

        if (displayName) profile.displayName = displayName.trim();
        if (bio !== undefined) profile.bio = bio.trim();
        if (twitter !== undefined) profile.twitter = twitter.trim();
        if (github !== undefined) profile.github = github.trim();
        if (website !== undefined) profile.website = website.trim();
        if (walletAddress !== undefined) profile.walletAddress = walletAddress.trim();

        await profile.save();
        res.json({ success: true, profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ────────────────────────────────────────────────────────
   Admin: GET /api/developer/pending-claims
   List all pending claims for admin review
──────────────────────────────────────────────────────── */
router.get('/pending-claims', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        const profiles = await DeveloperProfile.find({
            'pendingClaims.status': 'pending'
        }).populate('user', 'name email').lean();

        const claims = profiles.flatMap(p =>
            p.pendingClaims
                .filter(c => c.status === 'pending')
                .map(c => ({ ...c, developer: { name: p.user?.name, email: p.user?.email, profileId: p._id } }))
        );

        res.json({ success: true, claims });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ────────────────────────────────────────────────────────
   Admin: POST /api/developer/pending-claims/:claimId/approve
──────────────────────────────────────────────────────── */
router.post('/pending-claims/:claimId/approve', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        const { profileId } = req.body;
        const profile = await DeveloperProfile.findById(profileId);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        const claim = profile.pendingClaims.id(req.params.claimId);
        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        claim.status = 'approved';
        await profile.save();

        // Grant ownership on the tool
        await Tool.findOneAndUpdate(
            { id: claim.toolId },
            {
                developerClaimedBy: profile.user,
                developerClaimPending: false,
                claimVerificationMethod: 'twitter',
                claimVerifiedAt: new Date()
            }
        );

        // Upgrade tier to 'claimed' if still basic
        if (profile.tier === 'basic') {
            profile.tier = 'claimed';
            await profile.save();
        }

        res.json({ success: true, message: `Claim for ${claim.toolName} approved.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Admin: POST /api/developer/pending-claims/:claimId/reject
router.post('/pending-claims/:claimId/reject', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

        const { profileId } = req.body;
        const profile = await DeveloperProfile.findById(profileId);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        const claim = profile.pendingClaims.id(req.params.claimId);
        if (!claim) return res.status(404).json({ error: 'Claim not found' });

        claim.status = 'rejected';
        await profile.save();

        // Reset the tool's pending status
        await Tool.findOneAndUpdate(
            { id: claim.toolId },
            { developerClaimPending: false }
        );

        res.json({ success: true, message: `Claim for ${claim.toolName} rejected.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/* ────────────────────────────────────────────────────────
   POST /api/developer/verify-publish-tx
   Verifies on-chain listing fee tx via Etherscan before
   allowing a new app submission through.
──────────────────────────────────────────────────────── */
router.post('/verify-publish-tx', protect, async (req, res) => {
    try {
        const { txHash, verificationCode, appName } = req.body;
        if (!txHash || !verificationCode) {
            return res.status(400).json({ error: 'txHash and verificationCode are required.' });
        }

        const profile = await DeveloperProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(403).json({ error: 'Developer profile required.' });

        // If vault address not yet configured, skip on-chain check
        if (!process.env.W3C_VAULT_ADDRESS) {
            return res.json({
                success: true,
                verified: false,
                skipped: true,
                message: 'Vault address not yet configured — tx verification skipped. App queued for manual review.'
            });
        }

        const result = await verifyEtherscanTx(txHash, verificationCode);
        if (!result.ok) {
            return res.status(400).json({ success: false, error: result.reason });
        }

        res.json({
            success: true,
            verified: true,
            from: result.from,
            valueEth: result.valueEth,
            message: `✅ Transaction verified! ${result.valueEth.toFixed(4)} ETH received from ${result.from}`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
