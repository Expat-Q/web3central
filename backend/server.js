const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST — before anything else
dotenv.config({ path: path.join(__dirname, '.env') });

// Validate required env vars at startup
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const connectDB = require('./config/db');
const { fetchLlamaData } = require('./services/llamaService');

// Route imports
const toolsRouter = require('./routes/tools');
const communitySpotlightRouter = require('./routes/communitySpotlight');
const authRouter = require('./routes/auth');
const academyRouter = require('./routes/academy');
const aiRouter = require('./routes/ai');
const ratingsRouter = require('./routes/ratings');
const statsRouter = require('./routes/stats');
const chatRouter = require('./routes/chat');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- Security Middleware ---------------

// Helmet — sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// Rate limiting — protect auth endpoints from brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 requests per window per IP
  message: { success: false, message: 'Too many requests, please try again after 15 minutes' }
});
app.use('/api/auth', authLimiter);

// CORS — restrict to known frontend origins
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : [
    'http://localhost:3000',
    'https://web3central.vercel.app',
    'https://web3central-4ye286qqp-expatqs-projects.vercel.app'
  ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);

    // Check if origin matches allowed list or is a vercel.app subdomain
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 ||
      origin.endsWith('.vercel.app');

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

// Body parser with size limit to prevent payload attacks
app.use(express.json({ limit: '10kb' }));

// --------------- API Routes ---------------
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is live',
    version: '1.0.2',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/tools', toolsRouter);
app.use('/api/community-spotlight', communitySpotlightRouter);
app.use('/api/auth', authRouter);
app.use('/api/academy', academyRouter);
app.use('/api/ai', aiRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/chat', chatRouter);

// Serve frontend in production only
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// --------------- Global Error Handler ---------------
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message // Temporarily showing error message in prod for debugging
  });
});

// --------------- Background Workers ---------------

// DeFiLlama Sync Worker (Every 6 hours)
const SYNC_INTERVAL = 6 * 60 * 60 * 1000;
setInterval(async () => {
  try {
    await fetchLlamaData();
  } catch (err) {
    console.error('Scheduled DeFiLlama sync failed:', err.message);
  }
}, SYNC_INTERVAL);

// Initial Sync on Boot
setTimeout(async () => {
  try {
    console.log('Starting initial DeFiLlama sync...');
    await fetchLlamaData();
  } catch (err) {
    console.error('Initial DeFiLlama sync failed:', err.message);
  }
}, 5000);

// Start server only if running directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;