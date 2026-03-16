const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { incrementError } = require('../lib/metrics');

exports.protect = async (req, res, next) => {
    let token;
    const log = req.log || require('../lib/logger').logger;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        incrementError('auth');
        log.warn('Auth failed - no token provided', { correlationId: req.correlationId });
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            incrementError('auth');
            log.warn('Auth failed - user no longer exists', { correlationId: req.correlationId });
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        next();
    } catch (err) {
        incrementError('auth');
        log.warn('Auth failed - invalid token', { correlationId: req.correlationId, errorType: err.name });
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

exports.admin = (req, res, next) => {
    const log = req.log || require('../lib/logger').logger;
    
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        incrementError('auth');
        log.warn('Admin access denied', { correlationId: req.correlationId, userId: req.user?.id });
        res.status(403).json({ success: false, message: 'Not authorized as an admin' });
    }
};
