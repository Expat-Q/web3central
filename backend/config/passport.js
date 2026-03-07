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

// Helper to find or create user
const findOrCreateUser = async (providerIdField, profile, emailField, nameField, avatarField) => {
    try {
        // 1. Check if user already exists with this provider ID
        let user = await User.findOne({ [providerIdField]: profile.id });
        if (user) return user;

        // 2. Check if a user with this email already exists (Account Linking)
        const email = profile[emailField] && profile[emailField].length > 0 ? profile[emailField][0].value : null;

        if (email) {
            user = await User.findOne({ email });
            if (user) {
                user[providerIdField] = profile.id;
                if (!user.avatarUrl && avatarField) user.avatarUrl = avatarField;
                await user.save();
                return user;
            }
        }

        // 3. Create new user
        const newUser = {
            [providerIdField]: profile.id,
            name: profile[nameField] || 'Web3 Builder',
            email: email || `${profile.id}@${providerIdField.replace('Id', '')}.local`, // Fallback for no email
            avatarUrl: avatarField || ''
        };

        user = await User.create(newUser);
        return user;
    } catch (error) {
        throw error;
    }
};

// ============================================
// GOOGLE STRATEGY
// ============================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder_google_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder_google_secret',
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '';
        const user = await findOrCreateUser('googleId', profile, 'emails', 'displayName', avatar);
        done(null, user);
    } catch (err) {
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
