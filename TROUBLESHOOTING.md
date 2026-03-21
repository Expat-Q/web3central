# Troubleshooting Guide

This guide covers common issues you might encounter while developing or running Web3Central.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [Environment Configuration](#environment-configuration)
- [Authentication Issues](#authentication-issues)
- [API and Network Issues](#api-and-network-issues)
- [Frontend Issues](#frontend-issues)
- [CI/CD Issues](#cicd-issues)

---

## Installation Issues

### `npm install` fails with permission errors

**Symptoms:**
```
EACCES: permission denied
npm ERR! errno -13
```

**Solution:**
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Or use nvm to manage Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### `node-gyp` build errors

**Symptoms:**
```
gyp ERR! build error
node-gyp rebuild
```

**Solution:**
```bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt-get install build-essential python3

# Windows
npm install --global windows-build-tools
```

### Module not found errors

**Symptoms:**
```
Cannot find module 'express'
Error: Cannot find module '../lib/logger'
```

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Version conflicts

**Symptoms:**
```
npm WARN peer dependency conflict
```

**Solution:**
```bash
# Use --legacy-peer-deps if needed
npm install --legacy-peer-deps

# Or update to compatible versions
npm update
```

---

## Database Issues

### MongoDB connection failed

**Symptoms:**
```
MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

1. **Check if MongoDB is running:**
   ```bash
   # macOS
   brew services list | grep mongodb
   brew services start mongodb-community
   
   # Linux
   sudo systemctl status mongod
   sudo systemctl start mongod
   ```

2. **Check connection string:**
   ```bash
   # Local
   MONGODB_URI=mongodb://localhost:27017/web3central
   
   # Atlas
   MONGODB_URI=mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/web3central
   ```

3. **Test connection:**
   ```bash
   mongosh "your-connection-string"
   ```

### MongoDB Atlas IP not whitelisted

**Symptoms:**
```
MongoServerError: connection <n> to <host> closed
IP address ... not whitelisted
```

**Solution:**
1. Go to MongoDB Atlas > Network Access
2. Click "Add IP Address"
3. Add your current IP or `0.0.0.0/0` (for development only)
4. Wait 1-2 minutes for changes to propagate

### Database connection drops

**Symptoms:**
```
MongooseServerSelectionError: Server selection timed out
```

**Solutions:**
- Check your internet connection
- Verify Atlas cluster is not paused (free tier pauses after inactivity)
- Check Atlas status page for outages
- Try restarting the backend server

---

## Environment Configuration

### Missing environment variables

**Symptoms:**
```
FATAL: Missing required environment variable: MONGODB_URI
```

**Solution:**
```bash
# Ensure .env exists
cp backend/.env.example backend/.env

# Verify required variables are set
cat backend/.env | grep -E "^(MONGODB_URI|JWT_SECRET)="
```

### Wrong `.env` file location

**Symptoms:**
- Backend starts but can't connect to DB
- JWT errors on authentication

**Solution:**
- `.env` file must be in `backend/` directory, not project root
- Check path: `backend/.env`

### Environment variables not loading

**Symptoms:**
- `process.env.VARIABLE` is `undefined`

**Solution:**
```bash
# Check file exists and has correct format
cat backend/.env

# Ensure no spaces around = sign
# ✅ Correct
MONGODB_URI=mongodb://...

# ❌ Wrong
MONGODB_URI = mongodb://...
```

---

## Authentication Issues

### JWT errors

**Symptoms:**
```
JsonWebTokenError: invalid signature
TokenExpiredError: jwt expired
```

**Solutions:**

1. **Invalid signature:**
   - Ensure `JWT_SECRET` is the same in all environments
   - Clear local storage and re-login
   
2. **Token expired:**
   - Increase `JWT_EXPIRE` in `.env` (e.g., `30d`)
   - Implement token refresh on frontend

### OAuth callback fails

**Symptoms:**
```
redirect_uri_mismatch
```

**Solutions:**

1. **Google OAuth:**
   - Add callback URL to Google Console:
     - Dev: `http://localhost:5000/api/auth/google/callback`
     - Prod: `https://your-domain.com/api/auth/google/callback`

2. **Discord OAuth:**
   - Add redirect URL in Discord Developer Portal
   - Ensure exact match including trailing slash

3. **Check `FRONTEND_URL`:**
   ```bash
   # Must match where users are redirected after OAuth
   FRONTEND_URL=http://localhost:3000
   ```

### "Not authorized" errors

**Symptoms:**
```json
{"success": false, "message": "Not authorized to access this route"}
```

**Solutions:**

1. **Check token in request:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/auth/me
   ```

2. **Verify token format:**
   - Must be `Bearer <token>` (note the space)
   - Token should not have quotes

3. **Check token expiration:**
   ```javascript
   // Decode token to check expiration
   const jwt = require('jsonwebtoken');
   const decoded = jwt.decode(token);
   console.log(new Date(decoded.exp * 1000));
   ```

---

## API and Network Issues

### CORS errors

**Symptoms:**
```
Access to fetch at 'http://localhost:5000/api' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solutions:**

1. **Check `FRONTEND_URL` in backend `.env`:**
   ```bash
   FRONTEND_URL=http://localhost:3000
   ```

2. **For multiple origins:**
   ```bash
   FRONTEND_URL=http://localhost:3000,http://localhost:3001
   ```

3. **Verify backend is running on correct port:**
   ```bash
   curl http://localhost:5000/api/health
   ```

### Port already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5001 npm run dev
```

### External API failures (DeFiLlama, CoinGecko)

**Symptoms:**
```
DeFiLlama sync failed: timeout of 30000ms exceeded
Token price fetch failed: 429 Too Many Requests
```

**Solutions:**

1. **Rate limiting:**
   - CoinGecko free tier: 10-50 requests/minute
   - Wait and retry automatically

2. **API down:**
   - Check [DeFiLlama status](https://status.llama.fi/)
   - Data will refresh on next sync cycle (6 hours)

3. **Network issues:**
   ```bash
   # Test API directly
   curl -s https://api.llama.fi/protocols | head -c 100
   ```

---

## Frontend Issues

### React build fails

**Symptoms:**
```
Module not found: Can't resolve './Component'
```

**Solutions:**

1. **Check import paths:**
   ```javascript
   // ✅ Correct
   import Component from './Component';
   
   // ❌ Wrong (case sensitivity matters on Linux)
   import Component from './component';
   ```

2. **Clear cache:**
   ```bash
   rm -rf node_modules/.cache
   npm start
   ```

### Blank page after build

**Symptoms:**
- App works in development but shows blank page in production

**Solutions:**

1. **Check `homepage` in `package.json`:**
   ```json
   {
     "homepage": "."
   }
   ```

2. **Check for console errors:**
   - Open browser DevTools > Console

3. **Verify build output:**
   ```bash
   npm run build
   ls -la build/
   ```

### State not updating

**Symptoms:**
- UI doesn't reflect data changes
- Actions seem to have no effect

**Solutions:**

1. **Check for state mutation:**
   ```javascript
   // ❌ Wrong - mutating state
   state.items.push(newItem);
   
   // ✅ Correct - new array
   setItems([...items, newItem]);
   ```

2. **Check useEffect dependencies:**
   ```javascript
   useEffect(() => {
     fetchData();
   }, [dependency]); // Include all dependencies
   ```

---

## CI/CD Issues

### GitHub Actions failing

**Symptoms:**
- PR checks failing
- Build errors in CI

**Solutions:**

1. **Check workflow logs:**
   - Go to Actions tab in GitHub
   - Click on failed workflow
   - Review step-by-step logs

2. **Environment differences:**
   - CI uses clean install each time
   - Ensure all dependencies are in `package.json`

3. **Secrets not configured:**
   - Go to Settings > Secrets and variables > Actions
   - Add required secrets

### Vercel deployment fails

**Symptoms:**
- Build succeeds locally but fails on Vercel

**Solutions:**

1. **Check build command:**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build"
   }
   ```

2. **Check Node.js version:**
   - Vercel defaults may differ from local
   - Specify in `package.json`:
     ```json
     {
       "engines": {
         "node": "20.x"
       }
     }
     ```

3. **Check environment variables:**
   - Vercel dashboard > Settings > Environment Variables

---

## Getting Help

If you're still stuck:

1. **Search existing issues:** [GitHub Issues](https://github.com/Expat-Q/web3central/issues)
2. **Check the logs:** Use correlation IDs to trace errors
3. **Open a new issue** with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages and stack traces
   - Environment details (OS, Node version, etc.)
