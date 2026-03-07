const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

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
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                learningProgress: user.learningProgress
            }
        });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
});

// Update Profile details
router.put('/profile', protect, async (req, res) => {
    try {
        const { bio, twitter, name } = req.body;
        const user = await User.findById(req.user.id);

        if (bio !== undefined) user.bio = bio;
        if (twitter !== undefined) user.twitter = twitter;
        if (name !== undefined) user.name = name;

        await user.save();
        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
});

module.exports = router;
