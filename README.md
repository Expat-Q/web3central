# Web3Central

A comprehensive Web3 tools directory and learning platform featuring DeFi protocol metrics, an academy for blockchain education, and community spotlights.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Prerequisites

Ensure you have the following installed:

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | 18.x or 20.x | `node --version` |
| npm | 9.x+ | `npm --version` |
| MongoDB | 6.x+ (or Atlas) | `mongod --version` |
| Git | 2.x+ | `git --version` |

### Optional Tools

- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI for database inspection
- [jq](https://stedolan.github.io/jq/) - JSON processing for logs

## Quick Start

Get the app running in 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/Expat-Q/web3central.git
cd web3central

# 2. Install dependencies (both frontend and backend)
npm install
cd backend && npm install && cd ..

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your values (see Environment Setup below)

# 4. Start the backend (in one terminal)
cd backend && npm run dev

# 5. Start the frontend (in another terminal)
cd web3central && npm start
```

The frontend will open at `http://localhost:3000` and connect to the backend at `http://localhost:5000`.

## Environment Setup

### Backend Environment Variables

Copy the example file and configure:

```bash
cp backend/.env.example backend/.env
```

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/web3central` |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | `your-super-secret-jwt-key-here` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_EXPIRE` | Token expiration | `30d` |
| `FRONTEND_URL` | Allowed frontend origins | `http://localhost:3000` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `SERVICE_NAME` | Service identifier in logs | `web3central-backend` |

#### OAuth Configuration (Optional)

For social login support:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `DISCORD_CLIENT_ID` | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth client secret |
| `TWITTER_API_KEY` | Twitter API key |
| `TWITTER_API_SECRET` | Twitter API secret |

#### Email Configuration (Optional)

For email notifications:

| Variable | Description |
|----------|-------------|
| `SMTP_USER` | Gmail account for sending |
| `SMTP_PASS` | Gmail app password |
| `ADMIN_EMAIL` | Admin notification recipient |

### Local MongoDB Setup

If not using MongoDB Atlas:

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb

# Verify connection
mongosh --eval "db.adminCommand('ping')"
```

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create database user with read/write access
4. Whitelist your IP (or 0.0.0.0/0 for development)
5. Get connection string and add to `.env`

## Running the Application

### Development Mode

```bash
# Terminal 1: Backend with hot reload
cd backend
npm run dev

# Terminal 2: Frontend with hot reload
npm start
```

### Production Mode

```bash
# Build frontend
npm run build

# Start backend (serves frontend from build/)
cd backend
NODE_ENV=production npm start
```

### Verify Setup

```bash
# Check backend health
curl http://localhost:5000/api/health

# Expected response:
# {"success":true,"message":"Backend is live","version":"1.0.3","db":"connected"}

# Check metrics
curl http://localhost:5000/api/metrics
```

## Testing

### Frontend Tests

```bash
# Run React tests
npm test

# Run with coverage
npm test -- --coverage
```

### Backend Tests

```bash
cd backend

# Run all tests (when test infrastructure is added)
npm test

# Manual API testing
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

### Linting

```bash
# Frontend (uses Create React App's ESLint config)
npm run lint 2>/dev/null || npx eslint src/

# Check for issues without fixing
npx eslint src/ --max-warnings 0
```

## Project Structure

```
web3central/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── context/           # React context providers
│   ├── services/          # API service functions
│   ├── hooks/             # Custom React hooks
│   └── data/              # Static data files
├── backend/               # Express.js backend
│   ├── config/            # Database and passport config
│   ├── lib/               # Utilities (logger, metrics)
│   ├── middleware/        # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   └── server.js          # Application entry point
├── public/                # Static assets
├── docs/                  # Documentation
│   └── ops/               # Operational docs
├── build/                 # Production build output
└── package.json           # Frontend dependencies
```

## API Documentation

### Health & Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with DB status |
| `/api/metrics` | GET | Operational metrics |

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new user |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/me` | GET | Get current user (auth required) |
| `/api/auth/google` | GET | Initiate Google OAuth |
| `/api/auth/discord` | GET | Initiate Discord OAuth |

### Tools

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tools` | GET | List all tools by category |
| `/api/tools/:category` | GET | List tools in category |
| `/api/tools/submit` | POST | Submit new tool (auth required) |

### Academy

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/academy/courses` | GET | List all courses |
| `/api/academy/courses/:id` | GET | Get course details |

For full API documentation, see the route files in `backend/routes/`.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

### Quick Fixes

**Port already in use:**
```bash
# Find and kill process on port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**MongoDB connection failed:**
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Check your MONGODB_URI is correct
echo $MONGODB_URI
```

**Module not found:**
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

cd backend
rm -rf node_modules package-lock.json
npm install
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Branching strategy
- Commit conventions
- PR requirements
- Code review process

## License

ISC

## Links

- **Production:** https://web3central.vercel.app
- **API:** https://web3central.onrender.com/api
- **Issues:** https://github.com/Expat-Q/web3central/issues
