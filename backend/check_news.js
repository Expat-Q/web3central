const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const News = require('./models/News');

async function checkNews() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const count = await News.countDocuments();
    console.log(`Total News Articles: ${count}`);
    
    if (count > 0) {
      const articles = await News.find().limit(3);
      articles.forEach((a, i) => {
        console.log(`Article ${i+1}: ${a.title} (${a.slug})`);
      });
    } else {
      console.log('No news articles found. Creating a seed article...');
      const seed = await News.create({
        title: 'The Future of Web3Central',
        slug: 'future-of-web3central',
        shortDescription: 'Discover the roadmap for our next-generation news and learning engine.',
        contentMarkdown: '# The Future of Web3Central\n\nWelcome to the new era of crypto journalism.\n\n### What is next?\n- Real-time market analytics\n- Institutional grade reports\n- Community-driven insights',
        thumbnailUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2664&auto=format&fit=crop',
        tags: ['Ecosystem', 'Roadmap']
      });
      console.log('Seed article created:', seed.title);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

checkNews();
