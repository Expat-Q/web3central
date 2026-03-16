# Contributing to Web3Central

Thank you for your interest in contributing to Web3Central! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing Requirements](#testing-requirements)

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something useful for the Web3 community.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/web3central.git
   cd web3central
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/Expat-Q/web3central.git
   ```
4. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```
5. **Set up environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your local settings
   ```
6. **Run the app:**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   npm start
   ```

## Development Workflow

### Before Starting Work

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Check existing issues** to avoid duplicate work

3. **Create an issue** if one doesn't exist for your change

### Making Changes

1. Create a feature branch (see [Branching Strategy](#branching-strategy))
2. Make your changes
3. Test locally
4. Commit with proper message format
5. Push to your fork
6. Open a Pull Request

## Branching Strategy

### Branch Naming

Use descriptive branch names with prefixes:

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New features | `feature/wallet-connect` |
| `fix/` | Bug fixes | `fix/auth-token-expiry` |
| `docs/` | Documentation | `docs/api-reference` |
| `refactor/` | Code refactoring | `refactor/metrics-module` |
| `chore/` | Maintenance tasks | `chore/update-deps` |

### Examples

```bash
# Feature branch
git checkout -b feature/add-polygon-support

# Bug fix branch
git checkout -b fix/login-redirect-loop

# Documentation branch
git checkout -b docs/troubleshooting-guide
```

## Commit Conventions

We follow conventional commits for clear history and automated changelog generation.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding or updating tests |
| `chore` | Maintenance, dependencies |

### Examples

```bash
# Feature
git commit -m "feat(auth): add Discord OAuth integration"

# Bug fix
git commit -m "fix(api): handle empty response from DeFiLlama"

# Documentation
git commit -m "docs(readme): add troubleshooting section"

# Multiple changes
git commit -m "feat(tools): add tool submission form

- Add form component with validation
- Add backend endpoint for submissions
- Send email notification to admin

Closes #42"
```

### Rules

- Use present tense: "add feature" not "added feature"
- Use imperative mood: "fix bug" not "fixes bug"
- Keep subject under 72 characters
- Reference issues in footer: `Closes #123` or `Fixes #123`

## Pull Request Process

### Before Opening a PR

- [ ] Code compiles without errors
- [ ] All existing tests pass
- [ ] New code has appropriate tests (if applicable)
- [ ] No linting errors
- [ ] Branch is up to date with `main`
- [ ] Commit messages follow conventions
- [ ] Changes are documented (if user-facing)

### PR Checklist

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (describe)

## Testing
Describe how you tested your changes.

## Checklist
- [ ] I have tested this locally
- [ ] I have updated documentation (if needed)
- [ ] I have added tests (if applicable)
- [ ] My changes don't break existing functionality
```

### Verification Commands

Run these before submitting:

```bash
# Backend
cd backend
npm test 2>/dev/null || echo "No tests configured"
node -c server.js  # Syntax check

# Frontend
npm test -- --watchAll=false
npm run build  # Ensure it compiles

# Both
npm run lint 2>/dev/null || npx eslint src/ --max-warnings 10
```

### Review Expectations

- PRs require at least one approval
- Address all review comments
- Keep PRs focused and reasonably sized (<500 lines ideal)
- Be responsive to feedback
- Resolve conversations before merging

### After Merge

1. Delete your feature branch
2. Sync your fork with upstream
3. Celebrate! 🎉

## Code Style

### JavaScript/React

- Use ES6+ features
- Prefer functional components with hooks
- Use meaningful variable names
- Keep functions small and focused

### Examples

```javascript
// ✅ Good
const fetchTools = async (category) => {
  const response = await api.get(`/tools/${category}`);
  return response.data;
};

// ❌ Avoid
async function f(c) {
  var r = await api.get('/tools/' + c);
  return r.data;
}
```

### Backend

- Use structured logging via `logger`
- Include correlation IDs in error responses
- Validate inputs before processing
- Handle errors gracefully

```javascript
// ✅ Good
router.get('/:id', async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tool not found' 
      });
    }
    res.json({ success: true, tool });
  } catch (err) {
    req.log.error('Failed to fetch tool', { error: err });
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      correlationId: req.correlationId
    });
  }
});
```

## Testing Requirements

### What Needs Tests

- New API endpoints
- Utility functions
- Complex business logic
- Bug fixes (regression tests)

### What Can Skip Tests

- Simple pass-through functions
- Configuration changes
- Documentation-only changes

### Writing Tests

```javascript
// backend/__tests__/example.test.js
const { sanitizeObject } = require('../lib/logger');

describe('sanitizeObject', () => {
  it('should redact password fields', () => {
    const input = { user: 'test', password: 'secret123' };
    const result = sanitizeObject(input);
    expect(result.password).toBe('[REDACTED]');
    expect(result.user).toBe('test');
  });
});
```

## Questions?

- Check existing issues and discussions
- Open a new issue with the `question` label
- Join the community discussions

---

Thank you for contributing to Web3Central! 🚀
