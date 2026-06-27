const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Tool = require('../models/Tool');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { verifyMessage, createPublicClient, http } = require('viem');
const { mainnet } = require('viem/chains');
const axios = require('axios');
const { uploadProofTo0GStorage } = require('../utils/zgStorageHelper');

const publicClient = createPublicClient({
    chain: mainnet,
    transport: http('https://rpc.ankr.com/eth')
});

const erc20Abi = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }],
    }
];

const COVALENT_CHAINS = {
    ethereum: 'eth-mainnet',
    base: 'base-mainnet',
    arbitrum: 'arbitrum-mainnet',
    polygon: 'matic-mainnet',
    optimism: 'optimism-mainnet'
};

const COVALENT_API_KEY = process.env.COVALENT_API_KEY || 'cqt_rQ63xxtV49fKyW63P6F4kY4cXYk9'; // Free public trial key

// Verify interaction with Covalent Multi-chain API or token balance check via RPC
async function verifyOnChainInteraction(walletAddress, contractAddresses) {
    if (!walletAddress || !contractAddresses || contractAddresses.length === 0) {
        return { success: false, reason: 'Missing parameters' };
    }

    let checkedTokens = [];
    let checkedTransactions = [];

    // 1. Try Covalent Multi-Chain Transaction Verification
    for (const contract of contractAddresses) {
        const chain = contract.chain || 'ethereum';
        const targetAddress = contract.address ? contract.address.toLowerCase() : '';
        if (!targetAddress) continue;

        const covalentChain = COVALENT_CHAINS[chain.toLowerCase()] || 'eth-mainnet';

        try {
            // Query Covalent API for user's transaction history on this chain
            const response = await axios.get(
                `https://api.covalenthq.com/v1/${covalentChain}/address/${walletAddress}/transactions_v3/`,
                {
                    params: { key: COVALENT_API_KEY },
                    timeout: 8000
                }
            );

            if (response.data && response.data.data && Array.isArray(response.data.data.items)) {
                const txs = response.data.data.items;
                // Look for direct transaction to the protocol contract
                const interaction = txs.find(tx => 
                    (tx.to_address && tx.to_address.toLowerCase() === targetAddress) ||
                    (tx.from_address && tx.from_address.toLowerCase() === targetAddress)
                );

                if (interaction) {
                    return { 
                        success: true, 
                        method: 'covalent_api', 
                        chain,
                        address: targetAddress,
                        txHash: interaction.tx_hash 
                    };
                }
                checkedTransactions.push({ chain, address: targetAddress, found: false });
            }
        } catch (err) {
            console.warn(`Covalent API query failed for chain ${chain}:`, err.message);
        }
    }

    // 2. Fallback: Check ERC20 / Token balance using viem
    for (const contract of contractAddresses) {
        const targetAddress = contract.address;
        const chain = contract.chain || 'ethereum';

        if (chain.toLowerCase() === 'ethereum' && targetAddress) {
            try {
                const balance = await publicClient.readContract({
                    address: targetAddress,
                    abi: erc20Abi,
                    functionName: 'balanceOf',
                    args: [walletAddress]
                });

                if (balance > 0n) {
                    return { 
                        success: true, 
                        method: 'token_balance', 
                        chain,
                        address: targetAddress,
                        balance: balance.toString()
                    };
                }
                checkedTokens.push({ chain, address: targetAddress, balance: balance.toString() });
            } catch (err) {
                console.error(`Error reading contract balance for ${targetAddress}:`, err.message);
            }
        }
    }

    return { 
        success: false, 
        reason: 'No matching transaction history or token balance found on-chain.',
        checkedTransactions,
        checkedTokens
    };
}

// Dynamically retrieve contract addresses from CoinGecko's open API using protocol's geckoId
async function fetchDynamicContractsFromCoingecko(geckoId) {
    if (!geckoId) return [];
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${geckoId}`, {
            timeout: 5000
        });
        if (response.data && response.data.platforms) {
            const platforms = response.data.platforms;
            const platformMap = {
                'ethereum': 'ethereum',
                'base': 'base',
                'arbitrum-one': 'arbitrum',
                'polygon-pos': 'polygon',
                'optimistic-ethereum': 'optimism'
            };
            
            const contracts = [];
            for (const [platform, address] of Object.entries(platforms)) {
                const chainName = platformMap[platform];
                if (chainName && address) {
                    contracts.push({
                        chain: chainName,
                        address: address.toLowerCase()
                    });
                }
            }
            return contracts;
        }
    } catch (err) {
        console.warn(`Failed to dynamically fetch contracts from CoinGecko for ${geckoId}:`, err.message);
    }
    return [];
}

const ratingSchema = {
    body: {
        score: ['required', { type: 'number', min: 1, max: 5, integer: true }],
        comment: [{ type: 'string', maxLength: 1000 }],
        walletAddress: [{ type: 'string' }],
        signature: [{ type: 'string' }],
        signedMessage: [{ type: 'string' }],
        zkProof: [{ type: 'object' }],
        nullifierHash: [{ type: 'string' }],
        anonymousName: [{ type: 'string' }],
        isZKVerified: [{ type: 'boolean' }],
        sandboxBypass: [{ type: 'boolean' }]
    },
    params: {
        toolId: ['required', { type: 'string', minLength: 1, maxLength: 100 }]
    }
};

// @desc    Get ratings for a specific tool
// @route   GET /api/ratings/:toolId
// @access  Public
router.get('/:toolId', async (req, res) => {
    try {
        const ratings = await Rating.find({ tool: req.params.toolId })
            .populate('user', 'name avatarUrl')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: ratings.length, data: ratings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Add or update rating for a tool
// @route   POST /api/ratings/:toolId
// @access  Private
router.post('/:toolId', protect, validate(ratingSchema), async (req, res) => {
    try {
        const { score, comment, walletAddress, signature, signedMessage, zkProof, nullifierHash, anonymousName, isZKVerified, sandboxBypass, fheCiphertext, ogLabsTxHash } = req.body;
        const toolId = req.params.toolId;

        // Check if tool exists
        const tool = await Tool.findOne({ id: toolId });
        if (!tool) {
            return res.status(404).json({ success: false, message: 'Tool not found' });
        }

        // Verify cryptographic signature
        if (!signature || !signedMessage || !walletAddress) {
            return res.status(401).json({ success: false, error: 'Cryptographic review proof and wallet signature are required.' });
        }

        try {
            const isValid = await verifyMessage({
                address: walletAddress,
                message: signedMessage,
                signature: signature
            });
            if (!isValid) {
                return res.status(401).json({ success: false, error: 'Cryptographic signature is invalid.' });
            }
        } catch (err) {
            return res.status(401).json({ success: false, error: 'Failed to verify cryptographic signature: ' + err.message });
        }

        // Verify signed message matches rating parameters to prevent replay attacks
        if (!signedMessage.includes(`ID: ${toolId}`) || !signedMessage.includes(`Rating: ${score} Stars`)) {
            return res.status(400).json({ success: false, error: 'Signature payload does not match the submitted rating values.' });
        }

        // ZK-Nullifier double voting check
        if (nullifierHash) {
            const existingNullifier = await Rating.findOne({ tool: toolId, nullifierHash });
            if (existingNullifier && existingNullifier.user.toString() !== req.user.id) {
                return res.status(400).json({ success: false, error: 'This wallet has already submitted a review for this protocol (ZK-Nullifier duplicate).' });
            }
        }

        // --- Proof of Interaction Verification ---
        let targetContracts = tool.contractAddresses || [];
        
        // Dynamic Fallback: If no contracts are saved in our DB, try fetching dynamically from CoinGecko!
        if (targetContracts.length === 0 && tool.geckoId) {
            console.log(`No registered contracts in DB for ${tool.name}. Querying CoinGecko dynamically for geckoId: ${tool.geckoId}...`);
            targetContracts = await fetchDynamicContractsFromCoingecko(tool.geckoId);
        }

        if (targetContracts.length > 0) {
            if (!walletAddress) {
                return res.status(403).json({ success: false, error: 'Wallet connection required to verify interaction with this protocol.' });
            }
            
            const verification = await verifyOnChainInteraction(walletAddress, targetContracts);
            if (!verification.success && !sandboxBypass) {
                return res.status(403).json({ 
                    success: false, 
                    error: `Proof of Interaction Verification Failed: ${verification.reason} You can enable 'Sandbox Bypass Mode' in the rating modal to submit reviews for testing purposes without active on-chain history.` 
                });
            }
        }

        // Upload proof and metadata to 0G Labs Storage nodes
        let liveOgLabsTxHash = ogLabsTxHash;
        let liveRootHash = null;
        if (isZKVerified) {
            try {
                console.log(`[0G Storage] Triggering review upload for tool: ${toolId}...`);
                const uploadResult = await uploadProofTo0GStorage({
                    score,
                    comment,
                    zkProof,
                    nullifierHash
                });
                if (uploadResult && uploadResult.txHash) {
                    liveOgLabsTxHash = uploadResult.txHash;
                    liveRootHash = uploadResult.rootHash;
                }
            } catch (storageErr) {
                console.error('[0G Storage Route Error]', storageErr.message);
            }
        }

        // Check if user already rated this tool
        let rating = await Rating.findOne({ user: req.user.id, tool: toolId });
        let isNewReview = false;

        if (rating) {
            // Update existing rating
            rating.score = score;
            rating.comment = comment;
            rating.walletAddress = walletAddress;
            rating.signature = signature;
            rating.signedMessage = signedMessage;
            rating.zkProof = zkProof;
            rating.nullifierHash = nullifierHash;
            rating.anonymousName = anonymousName;
            rating.isZKVerified = isZKVerified;
            rating.fheCiphertext = fheCiphertext;
            rating.ogLabsTxHash = liveOgLabsTxHash;
            await rating.save();
        } else {
            // Create new rating
            isNewReview = true;
            rating = await Rating.create({
                user: req.user.id,
                tool: toolId,
                score,
                comment,
                walletAddress,
                signature,
                signedMessage,
                zkProof,
                nullifierHash,
                anonymousName,
                isZKVerified,
                fheCiphertext,
                ogLabsTxHash: liveOgLabsTxHash
            });
        }

        // Recalculate average rating for the tool
        const allRatings = await Rating.find({ tool: toolId });
        const avgRating = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;

        const newRating = parseFloat(avgRating.toFixed(1));
        const newReviews = allRatings.length;

        await Tool.updateOne(
            { id: toolId },
            { 
                $set: { 
                    rating: newRating,
                    reviews: newReviews
                }
            }
        );

        // 💎 GAMIFICATION: Award Diamonds for new reviews
        let diamondsEarned = 0;
        if (isNewReview) {
            diamondsEarned = 10;
            await User.findByIdAndUpdate(req.user.id, {
                $inc: { diamonds: diamondsEarned, totalXP: diamondsEarned, reviewCount: 1 }
            });
        }

        res.status(200).json({ 
            success: true, 
            data: rating, 
            toolAvg: newRating,
            diamondsEarned
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Developer replies to a review
// @route   POST /api/ratings/:ratingId/reply
// @access  Private
router.post('/:ratingId/reply', protect, async (req, res) => {
    try {
        const { reply } = req.body;
        if (!reply || !reply.trim()) {
            return res.status(400).json({ success: false, error: 'Reply text is required.' });
        }

        const rating = await Rating.findById(req.params.ratingId);
        if (!rating) return res.status(404).json({ success: false, error: 'Review not found.' });

        // Verify the requesting user owns the tool (submitted or claimed it)
        const tool = await Tool.findOne({ id: rating.tool });
        if (!tool) return res.status(404).json({ success: false, error: 'App not found.' });

        const isOwner =
            (tool.submitter && tool.submitter.toString() === req.user.id) ||
            (tool.developerClaimedBy && tool.developerClaimedBy.toString() === req.user.id);

        if (!isOwner) {
            return res.status(403).json({ success: false, error: 'Only the app developer can reply to reviews.' });
        }

        rating.developerReply = reply.trim();
        rating.developerRepliedAt = new Date();
        await rating.save();

        res.json({ success: true, data: rating });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
