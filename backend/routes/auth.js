const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../errors');

router.post('/register', asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw AppError.validation('Please provide name, email and password');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw AppError.conflict('User with this email already exists');
    }

    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
}));

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

router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw AppError.validation('Please provide an email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw AppError.auth('Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        throw AppError.auth('Invalid credentials');
    }

    sendTokenResponse(user, 200, res);
}));

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

router.get('/me', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        throw AppError.notFound('User');
    }
    res.status(200).json({ success: true, user });
}));

router.put('/profile', protect, asyncHandler(async (req, res) => {
    const { bio, twitter, name } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
        throw AppError.notFound('User');
    }

    if (bio !== undefined) user.bio = bio;
    if (twitter !== undefined) user.twitter = twitter;
    if (name !== undefined) user.name = name;

    await user.save();
    res.status(200).json({ success: true, user });
}));

module.exports = router;
