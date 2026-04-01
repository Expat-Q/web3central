require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        try {
            const newUser = {
                googleId: 'test_google_1234',
                name: 'Test Builder',
                email: 'test4@gmail.com',
                avatarUrl: ''
            };
            
            console.log('Attempting to create user...');
            const user = await User.create(newUser);
            console.log('User created:', user);
        } catch (error) {
            console.error('ERROR creating user:', error.message);
            console.error(error.stack);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('Connect error:', err);
        process.exit(1);
    });
