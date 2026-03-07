const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    url: { type: String, required: true },
    platform: { type: String, default: 'Other' },
    thumbnail: { type: String, default: '' },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    isFree: { type: Boolean, default: true },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

function youtubeThumbnail(url) {
    if (!url) return '';
    const m = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : '';
}

const courses = [
    // Marketing (Beginner)
    {
        title: 'Google Digital Marketing & E-commerce Professional Certificate',
        url: 'https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['marketing', 'e-commerce', 'google'],
        description: 'Learn the fundamentals of digital marketing and e-commerce from experts at Google.'
    },
    {
        title: 'Introduction to Marketing',
        url: 'https://www.coursera.org/learn/wharton-marketing',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['marketing', 'fundamentals', 'business'],
        description: 'Discover the foundations of marketing, branding, and effective go-to-market strategies.'
    },
    {
        title: 'Think Outside the Inbox: Email Marketing',
        url: 'https://www.coursera.org/learn/think-outside-the-inbox',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['email marketing', 'google'],
        description: 'Master email marketing techniques and launch successful campaigns.'
    },
    {
        title: 'Marketing Analytics Foundation',
        url: 'https://www.coursera.org/learn/marketing-analytics-foundation',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['marketing analytics', 'data'],
        description: 'Learn how to measure marketing success using analytics tools.'
    },
    {
        title: 'Google Ads Certifications',
        url: 'https://skillshop.docebosaas.com/learn/public/catalog/view/1',
        platform: 'Other', isFree: false, level: 'Beginner', tags: ['google ads', 'certification'],
        description: 'Master Google Ads with official certification training.'
    },
    {
        title: 'Introduction To Marketing | Marketing 101',
        url: 'https://www.youtube.com/watch?v=8Sj2tbh-ozE',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['marketing basics', 'marketing 101'],
        description: 'A comprehensive guide explaining the core concepts of marketing.'
    },
    {
        title: 'Marketing For Beginners',
        url: 'https://www.youtube.com/watch?v=QusJ4fpWQwA',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['marketing', 'strategy'],
        description: 'An actionable beginner blueprint for marketing products and scaling businesses.'
    },
    {
        title: 'Complete SEO Course for Beginners',
        url: 'https://www.youtube.com/watch?v=xsVTqzratPs',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['seo', 'search engine optimization'],
        description: 'Learn the exact strategies to rank higher on Google through keyword research.'
    },
    // Marketing (Intermediate)
    {
        title: 'IBM SEO Mastery: From Fundamentals to GenAI and GEO Strategies',
        url: 'https://www.coursera.org/specializations/seo-mastery-from-fundamentals-to-genai-and-geo-strategies',
        platform: 'Coursera', isFree: false, level: 'Intermediate', tags: ['seo', 'ibm', 'ai'],
        description: 'Master advanced SEO techniques including the impact of Generative AI.'
    },
    // Marketing (Advanced)
    {
        title: 'Mega Digital Marketing Course A-Z',
        url: 'https://www.udemy.com/course/digital-marketing-strategy-course-wordpress-seo-instagram-facebook/',
        platform: 'Udemy', isFree: false, level: 'Advanced', tags: ['digital marketing', 'social media'],
        description: 'An extensive mastery course covering everything from SEO to Facebook ads.'
    },

    // Content and Copywriting
    {
        title: 'SEO Tutorial | Simplilearn',
        url: 'https://www.youtube.com/watch?v=MYE6T_gd7H0',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['seo', 'tutorial'],
        description: 'Step-by-step SEO tutorial exploring how search engines work.'
    },
    {
        title: 'SEO Course for Beginners (by Ahrefs)',
        url: 'https://www.youtube.com/watch?v=btwC4zmewss&list=PLvJ_dXFSpd2vk6rQ4Rta5MhDIRmakFbp6',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['seo', 'ahrefs'],
        description: 'Practical techniques to drive consistent organic traffic to any website.'
    },
    {
        title: 'Content Creation and Copywriting Specialization',
        url: 'https://www.coursera.org/specializations/content-creation-and-copywriting',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['copywriting', 'content creation'],
        description: 'Develop the writing skills necessary to create engaging copy and blogs.'
    },
    {
        title: 'Secrets to Content that Engages and Converts',
        url: 'https://www.coursera.org/learn/secrets-to-content-that-engages-and-converts',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['content marketing', 'conversion'],
        description: 'Discover the psychological triggers that turn casual readers into customers.'
    },
    {
        title: 'AI-Enhanced Copywriting: SurferSEO, Upword and Anyword',
        url: 'https://www.coursera.org/learn/ai-enhanced-copywriting-surferseo-upword-and-anyword',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['ai copywriting', 'seo'],
        description: 'Learn to leverage modern AI tools to accelerate your writing workflow.'
    },
    {
        title: 'The Content Writing Course',
        url: 'https://www.udemy.com/course/the-content-writing-course/',
        platform: 'Udemy', isFree: false, level: 'Beginner', tags: ['content writing', 'freelance'],
        description: 'Everything you need to step into the world of professional content writing.'
    },
    {
        title: 'Practical Copywriting Course for Beginners',
        url: 'https://www.youtube.com/watch?v=Pum2gV7N_9A',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['copywriting', 'sales copy'],
        description: 'A pragmatic walkthrough on writing high-converting copy.'
    },
    {
        title: 'How to Get Into UX Writing',
        url: 'https://www.youtube.com/watch?v=1Yvu-i9H6lI',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['ux writing', 'user experience'],
        description: 'Learn the ins and outs of UX writing and crafting clear microcopy.'
    },
    {
        title: 'AI Marketing Mastery',
        url: 'https://www.coursera.org/specializations/ai-marketing-mastery',
        platform: 'Coursera', isFree: false, level: 'Intermediate', tags: ['ai', 'marketing automation'],
        description: 'Explore how top companies integrate AI across marketing campaigns.'
    },
    {
        title: 'COMPLETE Creative Writing - All Genres - THE FULL COURSE!',
        url: 'https://www.udemy.com/course/the-complete-creative-writer-all-genres-a-full-course/',
        platform: 'Udemy', isFree: false, level: 'Advanced', tags: ['creative writing', 'storytelling'],
        description: 'An advanced deep dive into the craft of writing across multiple genres.'
    },

    // Content Management & Social Media Marketing
    {
        title: 'Meta Social Media Marketing Professional Certificate',
        url: 'https://www.coursera.org/professional-certificates/facebook-social-media-marketing',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['social media', 'meta'],
        description: 'Launch your career as a social media marketer with Meta\'s official program.'
    },
    {
        title: 'Adobe\'s Social Media Content and Strategy',
        url: 'https://www.coursera.org/learn/social-media-content-and-strategy',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['social media strategy', 'adobe'],
        description: 'Learn strategic planning and design principles directly from Adobe experts.'
    },
    {
        title: 'Social Media Management',
        url: 'https://www.coursera.org/learn/social-media-management',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['social media', 'brand management'],
        description: 'Understand the fundamental duties of a social media manager.'
    },
    {
        title: 'Social Media Marketing Training | Simplilearn',
        url: 'https://www.youtube.com/watch?v=KEirK5QWgrA&list=PLEiEAq2VkUUK4-Inc4LAUDeiCSLWFX2u-',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['social media marketing'],
        description: 'A crash course showing how to establish brand presence on social networks.'
    },
    {
        title: 'How To Become A Social Media Manager - Beginners Guide',
        url: 'https://youtu.be/y-n1RUbYq6Q',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['smm career'],
        description: 'A realistic guide on breaking into social media management.'
    },
    {
        title: 'Content Management Systems Explained For Beginners',
        url: 'https://youtu.be/deqX0gMeUVc',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['cms', 'web basics'],
        description: 'A breakdown of how Content Management Systems power the web.'
    },
    {
        title: 'How to Master the Instagram Algorithm',
        url: 'https://www.youtube.com/watch?v=WXBW8X-cc98',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['instagram algorithm'],
        description: 'Understand how the Instagram algorithm prioritizes content.'
    },
    {
        title: 'Social Media Analytics',
        url: 'https://www.coursera.org/specializations/social-media-analytics',
        platform: 'Coursera', isFree: false, level: 'Intermediate', tags: ['analytics', 'data'],
        description: 'Learn to extract and interpret social media data to assess marketing efforts.'
    },
    {
        title: 'HubSpot\'s Social Media Marketing Certification Course',
        url: 'https://academy.hubspot.com/courses/social-media',
        platform: 'Other', isFree: false, level: 'Intermediate', tags: ['hubspot', 'social media strategy'],
        description: 'HubSpot\'s acclaimed certification covering inbound social strategy.'
    },
    {
        title: 'The Advance Social Media Management Masterclass: ROI Guide',
        url: 'https://www.udemy.com/course/the-advance-social-media-management-masterclass-roi-guide/',
        platform: 'Udemy', isFree: false, level: 'Advanced', tags: ['roi', 'smm'],
        description: 'Advanced methodologies for maximizing and tracking Social Media ROI.'
    },

    // Smart Contract Engineering
    {
        title: 'Solidity For Beginners',
        url: 'https://www.coursera.org/projects/solidity-for-beginners-write-and-test-smart-contracts',
        platform: 'Coursera', isFree: false, level: 'Beginner', tags: ['solidity', 'smart contracts'],
        description: 'A guided hands-on project to write your first smart contract.'
    },
    {
        title: 'Javascript by Alchemy',
        url: 'https://www.alchemy.com/university/courses/js',
        platform: 'Other', isFree: false, level: 'Beginner', tags: ['javascript', 'alchemy'],
        description: 'Build a strong Javascript foundation before diving into Web3 development.'
    },
    {
        title: 'Solidity by Alchemy',
        url: 'https://www.alchemy.com/university/courses/solidity',
        platform: 'Other', isFree: false, level: 'Beginner', tags: ['solidity', 'alchemy university'],
        description: 'Master Ethereum smart contract language through interactive exercises.'
    },
    {
        title: 'Solidity, Blockchain, and Smart Contract Course',
        url: 'https://youtu.be/M576WGiDBdQ',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['solidity', 'blockchain basics'],
        description: 'A massive course covering blockchain fundamentals to complex smart contracts.'
    },
    {
        title: 'How to Become a Smart Contract Engineer Roadmap',
        url: 'https://youtu.be/wNhAVahE-jk',
        platform: 'YouTube', isFree: true, level: 'Beginner', tags: ['roadmap', 'web3 career'],
        description: 'A structured roadmap outlining skills needed for a Web3 engineering job.'
    },
    {
        title: 'Smarter Contracts',
        url: 'https://www.coursera.org/learn/smarter-contracts',
        platform: 'Coursera', isFree: false, level: 'Intermediate', tags: ['smart contracts', 'dapps'],
        description: 'Design robust smart contracts architecture and integrate with DApps.'
    },
    {
        title: 'Advanced Smart Contract Development',
        url: 'https://www.coursera.org/learn/advanced-smart-contract-development',
        platform: 'Coursera', isFree: false, level: 'Intermediate', tags: ['advanced solidity', 'security'],
        description: 'Delve into advanced Solidity features, security patterns, and gas optimization.'
    },
    {
        title: 'Full 2024 Cyfrin Updraft Course',
        url: 'https://youtu.be/-1GB6m39-rM',
        platform: 'YouTube', isFree: true, level: 'Intermediate', tags: ['cyfrin', 'foundry'],
        description: 'A cutting-edge deep dive into Web3 tooling (Foundry) and smart contract development.'
    },
    {
        title: 'Ethereum Blockchain Developer Bootcamp With Solidity 2025',
        url: 'https://www.udemy.com/course/blockchain-developer/',
        platform: 'Udemy', isFree: false, level: 'Advanced', tags: ['ethereum bootcamp', 'solidity'],
        description: 'A comprehensive bootcamp covering decentralized application development.'
    },
    {
        title: 'Smart Contract Audits, Security, and DeFi FULL Course',
        url: 'https://www.youtube.com/watch?v=pUWmJ86X_do',
        platform: 'YouTube', isFree: true, level: 'Advanced', tags: ['web3 security', 'auditing'],
        description: 'Specialized course on securing smart contracts and DeFi protocols.'
    }
];

for (let c of courses) {
    if (c.platform === 'YouTube') {
        c.thumbnail = youtubeThumbnail(c.url);
    } else if (c.platform === 'Udemy') {
        c.thumbnail = 'https://s.udemycdn.com/meta/default-meta-image-v2.png';
    } else {
        c.thumbnail = ''; // Let frontend fallback handle it
    }
}

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    let added = 0; let skipped = 0;

    for (const c of courses) {
        const exists = await Course.findOne({ url: c.url });
        if (exists) {
            console.log(`SKIP (exists): ${c.title}`);
            skipped++;
        } else {
            await Course.create(c);
            console.log(`ADDED: ${c.title}`);
            added++;
        }
    }

    console.log(`\nDone. Added ${added}, Skipped ${skipped}.`);
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('Seed fails:', err.message);
    process.exit(1);
});
