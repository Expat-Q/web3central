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
        email: ['required', 'email'],
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
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=Google_Auth_Failed', session: false }),
    (req, res) => {
        handleOAuthSuccess(req, res);
    }
);

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

// Helper function to issue JWT and redirect to frontend
const handleOAuthSuccess = (req, res) => {
    // Create JWT token specifically for the frontend to consume
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });

    // We can't use sendTokenResponse here because we need to perform an HTTP redirect
    // back to the frontend React app domain, passing the token in the query string or fragment.
    const frontendUrl = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',')[0] // Use first allowed frontend
        : 'http://localhost:3000';

    // Redirect to a specific frontend route that will capture this token and save it to localStorage
    res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
        const user = await User.findById(req.user.id);
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

module.exports = router;
