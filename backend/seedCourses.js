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

// Helper: extract YouTube maxres thumbnail from URL
function youtubeThumbnail(url) {
    const m = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return m ? `https://img.youtube.com/vi/${m[1]}/maxresdefault.jpg` : '';
}

const courses = [
    // ── ANIMATION & DESIGN ───────────────────────────────────────────────────
    {
        title: 'Epic Games Game Design Professional Certificate',
        description: 'A professional certificate programme by Epic Games covering the fundamentals of game design, Unreal Engine, and level creation — from concept to polished prototype.',
        url: 'https://www.coursera.org/professional-certificates/epic-games-game-design-professional-certificate',
        platform: 'Coursera', isFree: false, level: 'Intermediate',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coursera_logo.svg/1200px-Coursera_logo.svg.png',
        tags: ['game design', 'unreal engine', 'epic games']
    },
    {
        title: 'VFX with Adobe After Effects from Novice to Expert',
        description: 'Learn professional VFX techniques in After Effects, from basic compositing and keying to motion graphics and cinematic visual effects used in real productions.',
        url: 'https://www.coursera.org/learn/vfx-with-adobe-after-effects-from-novice-to-expert',
        platform: 'Coursera', isFree: false, level: 'Beginner',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coursera_logo.svg/1200px-Coursera_logo.svg.png',
        tags: ['after effects', 'vfx', 'motion graphics']
    },
    {
        title: 'Beginner After Effects: Logo Animation',
        description: 'A beginner-friendly specialisation that walks you through animating brand logos and icons in Adobe After Effects, building a portfolio-ready motion design skill set.',
        url: 'https://www.coursera.org/specializations/beginner-after-effects-logo-animation',
        platform: 'Coursera', isFree: false, level: 'Beginner',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coursera_logo.svg/1200px-Coursera_logo.svg.png',
        tags: ['after effects', 'logo animation', 'motion design']
    },
    {
        title: 'Ultimate Blender 3D Character Creation & Animation Course',
        description: 'Build organic 3D characters from scratch in Blender, covering sculpting, rigging, skinning, and full character animation workflows used in games and film pipelines.',
        url: 'https://www.udemy.com/course/blender3dcharacteranimation/',
        platform: 'Udemy', isFree: false, level: 'Beginner',
        thumbnail: 'https://s.udemycdn.com/meta/default-meta-image-v2.png',
        tags: ['blender', '3d animation', 'character design']
    },
    {
        title: 'Learn How to Animate: 2D Animation for Beginners',
        description: 'Covers the 12 principles of animation applied practically in software, taking complete beginners through frame-by-frame and rig-based 2D animation techniques.',
        url: 'https://www.udemy.com/course/learn-animation/',
        platform: 'Udemy', isFree: false, level: 'Beginner',
        thumbnail: 'https://s.udemycdn.com/meta/default-meta-image-v2.png',
        tags: ['2d animation', 'animation principles', 'beginner']
    },
    {
        title: 'The Ultimate Character Design Course',
        description: 'An end-to-end character design programme covering concept art, proportion, expression sheets, colour theory, and preparing assets for animation — beginner to advanced.',
        url: 'https://www.udemy.com/course/the-ultimate-character-design-school-beginner-to-advanced/',
        platform: 'Udemy', isFree: false, level: 'Beginner',
        thumbnail: 'https://s.udemycdn.com/meta/default-meta-image-v2.png',
        tags: ['character design', 'concept art', 'illustration']
    },
    {
        title: 'Learn to Storyboard for Film or Animation',
        description: 'Industry-standard storyboarding techniques explained from scratch — shot composition, panel layout, camera language, and building a complete storyboard for a short film.',
        url: 'https://www.udemy.com/course/storyboard-for-film-or-animation/',
        platform: 'Udemy', isFree: false, level: 'Beginner',
        thumbnail: 'https://s.udemycdn.com/meta/default-meta-image-v2.png',
        tags: ['storyboard', 'film', 'animation pre-production']
    },
    {
        title: 'Free 2D Animation Course',
        description: 'A comprehensive free playlist covering 2D animation from the ground up — principles, tools, scene setup, and exporting finished animations ready for publishing.',
        url: 'https://www.youtube.com/watch?v=iZBKWoSTVX8&list=PL5xtQ0kWJKFTkj4onkLmsY5WGinTLcPH8',
        platform: 'YouTube', isFree: true, level: 'Beginner',
        thumbnail: youtubeThumbnail('https://www.youtube.com/watch?v=iZBKWoSTVX8'),
        tags: ['2d animation', 'free', 'beginner']
    },
    {
        title: 'Animation Basics in 14 Minutes',
        description: 'A fast, dense overview of the foundational principles of animation condensed into 14 minutes — ideal for anyone who wants a quick refresher or a strong conceptual grounding.',
        url: 'https://www.youtube.com/watch?v=pF--YKCCUMw&t=23s',
        platform: 'YouTube', isFree: true, level: 'Intermediate',
        thumbnail: youtubeThumbnail('https://www.youtube.com/watch?v=pF--YKCCUMw'),
        tags: ['animation', 'principles', 'quick guide']
    },
    {
        title: 'A Masterclass in Animation Specialization',
        description: 'A multi-course Coursera specialisation taught by industry animators that explores acting for animation, timing, weight, and storytelling through movement at an intermediate level.',
        url: 'https://www.coursera.org/specializations/a-masterclass-in-animation',
        platform: 'Coursera', isFree: false, level: 'Intermediate',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coursera_logo.svg/1200px-Coursera_logo.svg.png',
        tags: ['animation masterclass', 'specialization', 'intermediate']
    },

    // ── VIDEO CONTENT CREATION ────────────────────────────────────────────────
    {
        title: 'Freelance Editing: Launch & Build Your Video Editing Career',
        description: 'Learn how to start a freelance video editing business — from finding clients and pricing your work to delivering polished edits and managing a sustainable creative career.',
        url: 'https://www.coursera.org/learn/freelance-editing-launch--build-your-video-editing-career',
        platform: 'Coursera', isFree: false, level: 'Beginner',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coursera_logo.svg/1200px-Coursera_logo.svg.png',
        tags: ['video editing', 'freelance', 'career']
    },
    {
        title: 'The Art of Visual Storytelling',
        description: 'Explore the craft of visual narrative — cinematography, colour grading, pacing, and editing decisions that transform raw footage into emotionally compelling stories.',
        url: 'https://www.coursera.org/specializations/the-art-of-visual-storytelling',
        platform: 'Coursera', isFree: false, level: 'Beginner',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coursera_logo.svg/1200px-Coursera_logo.svg.png',
        tags: ['storytelling', 'cinematography', 'visual narrative']
    },
    {
        title: 'After Effects VFX: Special Effects Videos for Social Media',
        description: 'Create eye-catching special effects optimised for social media — animated text, particle effects, transitions, and green-screen compositing, all built in Adobe After Effects.',
        url: 'https://www.coursera.org/learn/after-effects-vfx-special-effects-videos-for-social-media',
        platform: 'Coursera', isFree: false, level: 'Beginner',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coursera_logo.svg/1200px-Coursera_logo.svg.png',
        tags: ['after effects', 'social media', 'vfx']
    },
    {
        title: 'How To Become a Content Creator — Complete Beginner\'s Guide',
        description: 'A comprehensive beginner\'s guide to launching a content creation career: choosing your niche, building a consistent brand, growing an audience, and monetising your channel.',
        url: 'https://www.youtube.com/watch?v=-HrfqfDyqCQ',
        platform: 'YouTube', isFree: true, level: 'Beginner',
        thumbnail: youtubeThumbnail('https://www.youtube.com/watch?v=-HrfqfDyqCQ'),
        tags: ['content creation', 'youtube', 'beginner guide']
    },
    {
        title: 'How to Make High Quality YouTube Videos on Your Phone',
        description: 'A practical video editing tutorial showing you exactly how to shoot and edit high-quality YouTube videos using only your smartphone — no expensive camera gear required.',
        url: 'https://www.youtube.com/watch?v=W4Mpz-R8xOU',
        platform: 'YouTube', isFree: true, level: 'Beginner',
        thumbnail: youtubeThumbnail('https://www.youtube.com/watch?v=W4Mpz-R8xOU'),
        tags: ['phone filming', 'youtube videos', 'mobile editing']
    },
    {
        title: '10 Mobile Videography Tips For Beginners',
        description: 'Ten actionable mobile videography tips for beginners covering framing, lighting, stability, and audio capture to immediately improve the quality of your smartphone footage.',
        url: 'https://www.youtube.com/watch?v=0nG7pAXRgvE',
        platform: 'YouTube', isFree: true, level: 'Beginner',
        thumbnail: youtubeThumbnail('https://www.youtube.com/watch?v=0nG7pAXRgvE'),
        tags: ['mobile videography', 'beginner tips', 'smartphone']
    },
    {
        title: 'Beginner vs Pro Mobile Filmmaker | Mobile Filmmaking Tips',
        description: 'A side-by-side comparison of beginner and professional mobile filmmaking techniques, demonstrating exactly what separates average footage from cinematic smartphone video.',
        url: 'https://www.youtube.com/watch?v=RlzSbyk_ZFw',
        platform: 'YouTube', isFree: true, level: 'Beginner',
        thumbnail: youtubeThumbnail('https://www.youtube.com/watch?v=RlzSbyk_ZFw'),
        tags: ['mobile filmmaking', 'cinematic', 'tips']
    },
    {
        title: 'Video Production Bootcamp: Videography, Cinematography+',
        description: 'A full production bootcamp covering camera settings, lighting rigs, audio gear, b-roll strategy, colour grading, and client workflows for professional videographers.',
        url: 'https://www.udemy.com/course/video-production-bootcamp/',
        platform: 'Udemy', isFree: false, level: 'Beginner',
        thumbnail: 'https://s.udemycdn.com/meta/default-meta-image-v2.png',
        tags: ['video production', 'cinematography', 'bootcamp']
    },
    {
        title: 'Complete Filmmaker Guide: Become an Incredible Video Creator',
        description: 'Everything you need to go from aspiring creator to confident filmmaker — shooting techniques, editing in Premiere Pro, colour grading, and building a professional showreel.',
        url: 'https://www.udemy.com/course/incrediblevideocreator/',
        platform: 'Udemy', isFree: false, level: 'Beginner',
        thumbnail: 'https://s.udemycdn.com/meta/default-meta-image-v2.png',
        tags: ['filmmaking', 'premiere pro', 'video creation']
    },
    {
        title: 'Premiere Pro Pt. 2 — Transitions, Graphics & Animation',
        description: 'The intermediate next step in Premiere Pro mastery — covering animated titles, motion graphics templates, seamless transitions, and advanced timeline workflows for polished edits.',
        url: 'https://www.coursera.org/learn/premiere-pro-pt-2-transitions-graphics-animation',
        platform: 'Coursera', isFree: false, level: 'Intermediate',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Coursera_logo.svg/1200px-Coursera_logo.svg.png',
        tags: ['premiere pro', 'motion graphics', 'transitions']
    },
];

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    let added = 0;
    let skipped = 0;

    for (const c of courses) {
        const exists = await Course.findOne({ url: c.url });
        if (exists) {
            console.log(`SKIP (already exists): ${c.title}`);
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
    console.error('Seed failed:', err.message);
    process.exit(1);
});
