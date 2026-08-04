const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

// Load environment variables FIRST — before anything else
dotenv.config({ path: path.join(__dirname, '.env') });

// Observability imports
const { logger } = require('./lib/logger');
const { correlationMiddleware } = require('./middleware/correlation');
const { requestLogger } = require('./middleware/requestLogger');
const { metricsMiddleware, getMetricsSummary, incrementError } = require('./lib/metrics');

// Validate required env vars at startup
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.error('Missing required environment variable', { key });
    process.exit(1);
  }
}

const connectDB = require('./config/db');
const { fetchLlamaData } = require('./services/llamaService');
const { errorHandler, notFoundHandler } = require('./errors');

// Route imports
const toolsRouter = require('./routes/tools');
const communitySpotlightRouter = require('./routes/communitySpotlight');
const authRouter = require('./routes/auth');
const academyRouter = require('./routes/academy');
const aiRouter = require('./routes/ai');
const ratingsRouter = require('./routes/ratings');
const statsRouter = require('./routes/stats');
const chatRouter = require('./routes/chat');
const defiRouter = require('./routes/defi');
const newsRouter = require('./routes/news');
const developerRouter = require('./routes/developer');
const questRouter = require('./routes/quests');
const ttsRouter = require('./routes/tts');


// Connect to Database
connectDB();

const compression = require('compression');
const app = express();

// Enable Gzip/Brotli compression for all API responses and static assets
app.use(compression());

// Trust reverse proxy (required for Render/Vercel to ensure correct 'https' protocol in OAuth redirects)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

const session = require('express-session');
const passport = require('passport');

// Load Passport Configuration
require('./config/passport');

// --------------- Security Middleware ---------------

// Helmet — sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// Session middleware — required for Passport OAuth strategies (especially OAuth 1.0a like Twitter)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_session_secret_for_dev_oauth',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

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
    'https://web3central.pro',
    'https://www.web3central.pro'
  ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, mobile apps)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.map(o => o.trim()).includes(origin) ||
      origin.endsWith('.web3central.pro');

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

// Body parser with size limit to prevent payload attacks
app.use(express.json({ limit: '10kb' }));

// --------------- Observability Middleware ---------------
app.use(correlationMiddleware);
app.use(metricsMiddleware);
app.use(requestLogger);

// --------------- API Routes ---------------
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    version: '1.0.4',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const { protect: protectAuth, admin: adminAuth } = require('./middleware/auth');
app.get('/api/metrics', protectAuth, adminAuth, (req, res) => {
  const metrics = getMetricsSummary();
  res.json({
    success: true,
    metrics
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
app.use('/api/defi', defiRouter);
app.use('/api/news', newsRouter);
app.use('/api/developer', developerRouter);
app.use('/api/quests', questRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/airdrops', require('./routes/airdrops'));


app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Web3Central backend is running',
    release: process.env.RENDER_GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || 'local'
  });
});

// Serve frontend in production only
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.use((req, res, next) => {
      if (!req.path.startsWith('/api')) {
        return res.sendFile(path.join(buildPath, 'index.html'));
      }
      next();
    });
  }
}

// 404 handler for unknown API routes (app.use('/api') matches any unhandled /api/* request in Express)
app.use('/api', notFoundHandler);

// --------------- Global Error Handler ---------------
app.use((err, req, res, next) => {
  const log = req.log || logger;
  log.error('Unhandled Error', {
    error: err,
    correlationId: req.correlationId,
    route: req.path,
    method: req.method
  });
  
  incrementError('server');
  
  // Use centralized error handler for structured responses
  errorHandler(err, req, res, next);
});

// --------------- Background Workers ---------------
const { startCronJobs } = require('./services/cronService');

// Start hourly background sync
startCronJobs();

// Initial Sync on Boot
const { syncStaticProtocolsToDb } = require('./services/syncProtocolsService');
setTimeout(async () => {
  try {
    logger.info('Starting initial DB protocols sync');
    await syncStaticProtocolsToDb();
    logger.info('Starting initial DeFiLlama sync');
    await fetchLlamaData();
    logger.info('Initial sync completed');
  } catch (err) {
    logger.error('Initial sync failed', { error: err });
    incrementError('transaction');
  }
}, 3000);

// Start server only if running directly
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('Server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
  });
}

module.exports = app;
