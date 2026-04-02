const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
// Fall back to passport-twitter (OAuth 1.0a) or use an OAuth2 strategy if you prefer. 
// Standard passport-twitter is most common for basic X login.
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Custom error class to signal an account conflict
class AccountExistsError extends Error {
    constructor() {
        super('ACCOUNT_EXISTS_USE_PASSWORD');
        this.name = 'AccountExistsError';
    }
}

// Helper to find or create user
const findOrCreateUser = async (providerIdField, profile, emailField, nameField, avatarField) => {
    try {
        console.log(`[DEBUG OAuth] Starting lookup for ${providerIdField} ID: ${profile.id}`);

        // 1. Check if user already exists with this provider ID
        let user = await User.findOne({ [providerIdField]: profile.id });
        if (user) {
            console.log(`[DEBUG OAuth] User found by provider ID: ${user.email}`);
            return user;
        }

        // 2. Check if a user with this email already exists
        // Google usually provides emails in profile.emails array
        let email = null;
        if (profile[emailField] && profile[emailField].length > 0) {
            email = profile[emailField][0].value;
        } else if (profile.email) {
            email = profile.email;
        }
        
        console.log(`[DEBUG OAuth] Extracted email: ${email}`);

        if (email) {
            user = await User.findOne({ email });
            if (user) {
                console.log(`[DEBUG OAuth] Email match found for existing user: ${email}`);
                // If the account was created manually (has a password, no provider ID yet),
                // reject the OAuth attempt to prevent silent account merging.
                if (!user[providerIdField]) {
                    console.log(`[DEBUG OAuth] Rejecting: Account has manual password but no ${providerIdField} linked.`);
                    throw new AccountExistsError();
                }
                // Otherwise the account already has this provider linked — just return it.
                return user;
            }
        }

        // 3. Create new user
        // Fallback email if none provided by provider
        const finalEmail = email || `${profile.id}@${providerIdField.replace('Id', '')}.local`;
        
        // Final name extraction
        const finalName = profile[nameField] || profile.displayName || profile.username || 'Web3 Builder';
        
        console.log(`[DEBUG OAuth] Creating new account: ${finalEmail} (Name: ${finalName})`);
        
        const newUser = {
            [providerIdField]: profile.id,
            name: finalName,
            email: finalEmail,
            avatarUrl: avatarField || ''
        };

        user = await User.create(newUser);
        console.log(`[DEBUG OAuth] New user created successfully: ${user.email}`);
        return user;
    } catch (error) {
        console.error(`[DEBUG OAuth] Error in findOrCreateUser:`, error);
        throw error;
    }
};

module.exports.AccountExistsError = AccountExistsError;

// ============================================
// GOOGLE STRATEGY
// ============================================
// Priority: GOOGLE_CALLBACK_URL > BACKEND_URL > RENDER_EXTERNAL_URL (built-in) > localhost
const getAbsoluteCallback = (path) => {
    let base =
        process.env.BACKEND_URL ||
        process.env.RENDER_EXTERNAL_URL ||
        'http://localhost:5000';
    
    // Safety check: remove trailing slash from base if present
    base = base.endsWith('/') ? base.slice(0, -1) : base;
    
    const finalUrl = `${base}${path}`;
    console.log(`[DEBUG OAuth] Setting absolute callback URL to: ${finalUrl}`);
    return finalUrl;
};

passport.use(new GoogleStrategy({
clientID: process.env.GOOGLE_CLIENT_ID,`r`n    clientSecret: process.env.GOOGLE_CLIENT_SECRET,`r`n    callbackURL: process.env.GOOGLE_CALLBACK_URL || getAbsoluteCallback('/api/auth/google/callback'),`r`n    proxy: true`r`n
=======
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
>>>>>>> fix-community-oauth
    callbackURL: process.env.GOOGLE_CALLBACK_URL || getAbsoluteCallback('/api/auth/google/callback'),
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('[DEBUG OAuth] Strategy successfully received Google profile:', profile.id);
        const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '';
        const user = await findOrCreateUser('googleId', profile, 'emails', 'displayName', avatar);
        done(null, user);
    } catch (err) {
        console.error('[DEBUG OAuth] Critical error in Strategy callback:', err);
        if (err.name === 'AccountExistsError') {
            return done(null, false, { message: 'ACCOUNT_EXISTS_USE_PASSWORD' });
        }
        done(err, null);
    }
}));

// ============================================
// DISCORD STRATEGY
// ============================================
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID || 'placeholder_discord_id',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || 'placeholder_discord_secret',
    callbackURL: '/api/auth/discord/callback',
    proxy: true,
    scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const avatar = profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : '';

        // Discord profile stores email directly on the object, so wrap it
        const discordProfile = { ...profile, emails: profile.email ? [{ value: profile.email }] : [] };
        const user = await findOrCreateUser('discordId', discordProfile, 'emails', 'username', avatar);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

// ============================================
// TWITTER / X STRATEGY (OAuth 1.0a)
// ============================================
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY || 'placeholder_twitter_key',
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET || 'placeholder_twitter_secret',
    callbackURL: '/api/auth/twitter/callback',
    proxy: true,
    includeEmail: true
}, async (token, tokenSecret, profile, done) => {
    try {
        const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '';
        const user = await findOrCreateUser('twitterId', profile, 'emails', 'displayName', avatar);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

module.exports = passport;

