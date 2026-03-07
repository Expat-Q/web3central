const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        // required: [true, 'Please add a password'], // Optional for OAuth users
        minlength: 6,
        select: false
    },
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    discordId: {
        type: String,
        sparse: true,
        unique: true
    },
    twitterId: {
        type: String,
        sparse: true,
        unique: true
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    bio: {
        type: String,
        default: ''
    },
    twitter: {
        type: String,
        default: ''
    },
    learningProgress: {
        type: Map,
        of: new mongoose.Schema({
            completed: { type: Boolean, default: false },
            quizScore: { type: Number, default: 0 },
            completedAt: { type: Date }
        }),
        default: {}
    },
    totalXP: {
        type: Number,
        default: 0
    },
    rank: {
        type: String,
        enum: ['Novice', 'Explorer', 'Specialist', 'Grandmaster'],
        default: 'Novice'
    },
    savedTools: [{
        type: String // Tool IDs
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
