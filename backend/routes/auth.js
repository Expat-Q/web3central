const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { normalizeLearningProgressMap, serializeLearningProgress } = require('../utils/learningProgress');


const registerSchema = {
    body: {
        name: ['required', { type: 'string', minLength: 2, maxLength: 50 }],
        email: ['required', 'email'],
        password: ['required', { type: 'string', minLength: 6, maxLength: 100 }]
    }
};

const loginSchema = {
    body: {
        email: ['required', { type: 'string', minLength: 1 }],
        password: ['required', { type: 'string', minLength: 1 }]
    }
};

const profileUpdateSchema = {
    body: {
        name: [{ type: 'string', minLength: 2, maxLength: 50 }],
        bio: [{ type: 'string', maxLength: 500 }],
        twitter: [{ type: 'string', maxLength: 255 }]
    }
};

const normalizeTwitterHandle = (input = '') => {
    const value = String(input || '').trim();
    if (!value) return '';

    // Accept full URLs, @handle, or plain handle.
    const match = value.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]{1,15})/i);
    const handle = match ? match[1] : value.replace(/^@/, '').split('/').pop();
    const clean = String(handle || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15);

    return clean ? `@${clean}` : '';
};

const deriveAvatarUrlFromTwitter = (twitter = '') => {
    const normalized = normalizeTwitterHandle(twitter);
    if (!normalized) return '';
    const handle = normalized.replace(/^@/, '');
    return `https://unavatar.io/twitter/${handle}`;
};

const serializeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || '',
    twitter: user.twitter || '',
    avatarUrl: user.avatarUrl || deriveAvatarUrlFromTwitter(user.twitter || ''),
    diamonds: user.diamonds || 0,
    totalXP: user.totalXP || 0,
    rank: user.rank || 'Novice',
    learningProgress: serializeLearningProgress(user.learningProgress)
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validate(registerSchema), async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        user = await User.create({
            name,
            email,
            password
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const passport = require('passport');

// @desc    OAuth - Initiate Google Login
// @route   GET /api/auth/google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    OAuth - Google Callback
// @route   GET /api/auth/google/callback
// @desc    OAuth - Google Callback
// @route   GET /api/auth/google/callback
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        const frontendUrl = process.env.FRONTEND_URL
            ? process.env.FRONTEND_URL.split(',')[0]
            : 'http://localhost:3000';

        if (err) {
            return res.redirect(`${frontendUrl}/login?error=Google_Auth_Failed`);
        }

        if (!user) {
            if (info && info.message === 'ACCOUNT_EXISTS_USE_PASSWORD') {
                return res.redirect(`${frontendUrl}/login?error=account_exists`);
            }
            return res.redirect(`${frontendUrl}/login?error=Google_Auth_Failed`);
        }

        req.user = user;
        handleOAuthSuccess(req, res);
    })(req, res, next);
});

// @desc    OAuth - Initiate Discord Login
// @route   GET /api/auth/discord
// @access  Public
router.get('/discord', passport.authenticate('discord'));

// @desc    OAuth - Discord Callback
// @route   GET /api/auth/discord/callback
router.get('/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/login?error=Discord_Auth_Failed', session: false }),
    (req, res) => {
        handleOAuthSuccess(req, res);
    }
);

// @desc    OAuth - Initiate Twitter Login
// @route   GET /api/auth/twitter
// @access  Public
router.get('/twitter', passport.authenticate('twitter'));

// @desc    OAuth - Twitter Callback
// @route   GET /api/auth/twitter/callback
router.get('/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login?error=Twitter_Auth_Failed', session: false }),
    (req, res) => {
        handleOAuthSuccess(req, res);
    }
);

// In-memory store for short-lived OAuth exchange codes (TTL: 60s)
// For multi-instance deployments, replace with Redis.
const oauthExchangeCodes = new Map();

// Helper function: issue a short-lived code, redirect to frontend with it
const handleOAuthSuccess = (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    // Generate a one-time code (expires in 60 seconds)
    const crypto = require('crypto');
    const code = crypto.randomBytes(32).toString('hex');
    oauthExchangeCodes.set(code, { token, expiresAt: Date.now() + 60_000 });

    // Clean up expired codes
    for (const [k, v] of oauthExchangeCodes) {
        if (v.expiresAt < Date.now()) oauthExchangeCodes.delete(k);
    }

    const frontendUrl = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',')[0]
        : 'http://localhost:3000';

    // Redirect with a short-lived CODE, not the JWT itself
    res.redirect(`${frontendUrl}/oauth/callback?code=${code}`);
};

// @desc    Exchange OAuth code for JWT (one-time use, 60s TTL)
// @route   POST /api/auth/oauth/exchange
// @access  Public
router.post('/oauth/exchange', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code is required' });

    const entry = oauthExchangeCodes.get(code);
    if (!entry) return res.status(401).json({ success: false, message: 'Invalid or expired code' });
    if (entry.expiresAt < Date.now()) {
        oauthExchangeCodes.delete(code);
        return res.status(401).json({ success: false, message: 'Code expired' });
    }

    // One-time use: delete immediately after retrieval
    oauthExchangeCodes.delete(code);

    // Verify the stored JWT is still valid and fetch user
    try {
        const decoded = jwt.verify(entry.token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ success: false, message: 'User not found' });
        res.json({ success: true, token: entry.token, user: serializeUser(user) });
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;

    try {
        const input = String(email || '').trim();
        // Check for user by email (case-insensitive) OR username (case-insensitive)
        const user = await User.findOne({
            $or: [
                { email: input.toLowerCase() },
                { name: { $regex: new RegExp('^' + input.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } }
            ]
        }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Auto-promote if email matches admin env var
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail && user.email === adminEmail && user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    const options = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .json({
            success: true,
            token,
            user: serializeUser(user)
        });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        
        // Auto-promote to admin if email matches ADMIN_EMAIL
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail && user.email === adminEmail && user.role !== 'admin') {
            console.log(`[AUTH] Auto-promoting ${user.email} to admin`);
            user.role = 'admin';
            await user.save();
        }

        normalizeLearningProgressMap(user);
        res.status(200).json({
            success: true,
            user: serializeUser(user)
        });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
});

// Update Profile details
router.put('/profile', protect, validate(profileUpdateSchema), async (req, res) => {
    try {
        const { bio, twitter, name } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updates = {};

        if (bio !== undefined) updates.bio = bio;
        if (twitter !== undefined) {
            const nextTwitter = normalizeTwitterHandle(twitter);
            const prevTwitter = normalizeTwitterHandle(user.twitter || '');
            updates.twitter = nextTwitter;

            // Keep avatar in sync with twitter handle updates.
            if (!nextTwitter) {
                updates.avatarUrl = '';
            } else if (nextTwitter !== prevTwitter || !user.avatarUrl) {
                updates.avatarUrl = deriveAvatarUrlFromTwitter(nextTwitter);
            }
        }
        if (name && name.trim().length > 0) updates.name = name.trim();

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        normalizeLearningProgressMap(updatedUser);

        res.status(200).json({ success: true, user: serializeUser(updatedUser) });
    } catch (error) {
        console.error("Profile Save Error:", error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update profile' });
    }
});

// @desc    Get leaderboard
// @route   GET /api/auth/leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find()
            .sort({ diamonds: -1, totalXP: -1 })
            .limit(50)
            .select('name diamonds totalXP twitter avatarUrl rank');
        
        const leaderboard = users.map(user => ({
            id: user._id,
            name: user.name,
            diamonds: user.diamonds || 0,
            totalXP: user.totalXP || 0,
            twitter: user.twitter || '',
            avatarUrl: user.avatarUrl || deriveAvatarUrlFromTwitter(user.twitter || ''),
            rank: user.rank || 'Novice'
        }));

        res.status(200).json({ success: true, leaderboard });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetToken +passwordResetExpire');

        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
        }

        // Generate secure random token
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.passwordResetToken = hashedToken;
        user.passwordResetExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL
            ? process.env.FRONTEND_URL.split(',')[0]
            : 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

        // Send email if SMTP is configured
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            try {
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                });
                await transporter.sendMail({
                    from: `"Web3Central" <${process.env.SMTP_USER}>`,
                    to: user.email,
                    subject: 'Password Reset Request — Web3Central',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2>Password Reset</h2>
                            <p>You requested a password reset for your Web3Central account.</p>
                            <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
                            <div style="margin: 24px 0; text-align: center;">
                                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                            </div>
                            <p style="color: #64748b; font-size: 14px;">If you didn't request this, ignore this email — your password won't change.</p>
                            <p style="color: #64748b; font-size: 12px;">Link expires: ${new Date(Date.now() + 15 * 60 * 1000).toUTCString()}</p>
                        </div>
                    `
                });
            } catch (emailErr) {
                // Reset the token if email fails so user can try again
                user.passwordResetToken = undefined;
                user.passwordResetExpire = undefined;
                await user.save({ validateBeforeSave: false });
                return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again.' });
            }
        }

        res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @desc    Complete password reset using token from email
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, token, and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    try {
        const crypto = require('crypto');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            email: email.toLowerCase(),
            passwordResetToken: hashedToken,
            passwordResetExpire: { $gt: new Date() }
        }).select('+passwordResetToken +passwordResetExpire');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
