/**
 * Seed script — creates a Developer Profile for expatq (owner of Base Sport Fantasy)
 * Run from: web3central/backend/
 * Usage: node scripts/seedExpatqDeveloper.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Tool = require('../models/Tool');
const DeveloperProfile = require('../models/DeveloperProfile');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find expatq's user account
        let user = await User.findOne({
            $or: [
                { name: { $regex: /expatq/i } },
                { email: { $regex: /expatq/i } }
            ]
        });

        if (!user) {
            console.log('⚠️  No user found with name/email matching "expatq".');
            console.log('   Creating user account for expatq...');

            user = await User.create({
                name: 'expatq',
                email: 'expatq@web3central.xyz',  // placeholder — update if needed
                password: 'changeme123',            // temporary password
                bio: 'Building at the intersection of sports and Web3.',
                role: 'user'
            });
            console.log(`✅ Created user: ${user.name} (${user._id})`);
        } else {
            console.log(`✅ Found user: ${user.name} (${user.email}) — ID: ${user._id}`);
        }

        // 2. Check for existing developer profile
        let profile = await DeveloperProfile.findOne({ user: user._id });

        if (profile) {
            console.log(`ℹ️  Developer profile already exists for ${user.name}. Updating...`);
            profile.displayName = 'expatq';
            profile.bio = 'Building Base Sport Fantasy — the first Web3 fantasy sports platform on Base.';
            profile.builderType = 'solo';
            profile.tier = 'claimed';
            profile.agreedToTermsAt = profile.agreedToTermsAt || new Date();
            await profile.save();
        } else {
            profile = await DeveloperProfile.create({
                user: user._id,
                displayName: 'expatq',
                bio: 'Building Base Sport Fantasy — the first Web3 fantasy sports platform on Base.',
                builderType: 'solo',
                twitter: 'https://x.com/expatq',
                github: '',
                website: 'https://basesportfantasy.xyz',
                walletAddress: '',
                tier: 'claimed',
                agreedToTermsAt: new Date()
            });
            console.log(`✅ Created developer profile for expatq (tier: claimed)`);
        }

        // 3. Find Base Sport Fantasy tool and link it
        const tool = await Tool.findOne({
            name: { $regex: /base.?sport.?fantasy/i }
        });

        if (tool) {
            tool.developerClaimedBy = user._id;
            tool.developerClaimPending = false;
            tool.claimVerificationMethod = 'admin';
            tool.claimVerifiedAt = new Date();
            await tool.save();
            console.log(`✅ Linked tool "${tool.name}" to expatq`);

            // Add to profile's pendingClaims as approved
            const alreadyClaimed = profile.pendingClaims?.some(c => c.toolId === tool.id && c.status === 'approved');
            if (!alreadyClaimed) {
                profile.pendingClaims = profile.pendingClaims || [];
                profile.pendingClaims.push({
                    toolId: tool.id || tool._id.toString(),
                    toolName: tool.name,
                    verificationCode: 'ADMIN-SEEDED',
                    method: 'admin',
                    status: 'approved',
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                });
                await profile.save();
                console.log(`✅ Claim record added to profile`);
            }
        } else {
            console.log(`⚠️  Tool "Base Sport Fantasy" not found in database.`);
            console.log(`   Submit it via the Developer Console at /developer/publish or check the tool name.`);
        }

        console.log('\n🎉 Done! Summary:');
        console.log(`   User:    ${user.name} (${user.email})`);
        console.log(`   Profile: ${profile.displayName} — Tier: ${profile.tier}`);
        if (tool) console.log(`   App:     ${tool.name} — Claimed ✅`);

    } catch (err) {
        console.error('❌ Seed error:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    }
}

seed();
