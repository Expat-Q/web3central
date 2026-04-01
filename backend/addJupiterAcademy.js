const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Course = require('./models/Course');

async function addJupiterAcademy() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if it already exists
    const existing = await Course.findOne({ url: 'https://academy.jup.ag/' });
    if (existing) {
      console.log('Jupiter Academy already exists in the database. Skipping.');
      return;
    }

    const course = await Course.create({
      title: 'Jupiter Academy',
      description: 'Backed by a searchable glossary of 80+ crypto terms, so no word ever stops you in your tracks again.',
      url: 'https://academy.jup.ag/',
      platform: 'Other',
      thumbnail: 'https://academy.jup.ag/img/jup-logo.png',
      level: 'Beginner',
      isFree: true,
      tags: ['DeFi', 'Solana', 'Jupiter', 'Glossary', 'Beginner']
    });

    console.log('✅ Jupiter Academy added successfully:', course.title);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}

addJupiterAcademy();
