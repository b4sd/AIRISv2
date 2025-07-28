# Git Ignore Configuration

This document explains what files and directories are ignored by Git in this project.

## Overview

The `.gitignore` file is configured to handle a monorepo structure with:

- **Frontend**: Next.js application with TypeScript
- **Backend**: Node.js/Fastify API with TypeScript
- **Shared**: Common utilities and types

## Ignored Categories

### 🔧 IDE and Editor Files

- `.vscode/`, `.idea/` - IDE settings
- `*.swp`, `*.swo`, `*~` - Editor temporary files
- `.history/` - File history from extensions

### 📦 Dependencies

- `node_modules/` - All dependency directories
- `npm-debug.log*`, `yarn-debug.log*` - Package manager logs

### 🌍 Environment Variables

- `.env*` files - All environment configuration files
- Separate entries for frontend and backend `.env` files

### 🏗️ Build Outputs

- `dist/`, `build/`, `out/` - Compiled code
- `backend/dist/` - TypeScript compilation output
- `frontend/.next/` - Next.js build cache
- `frontend/.swc/` - SWC compilation cache
- `*.d.ts.map`, `*.js.map` - Source map files

### 🧪 Testing

- `coverage/` - Test coverage reports
- `.nyc_output` - NYC coverage tool output

### 📝 Logs and Runtime

- `*.log` - All log files
- `*.pid*` - Process ID files
- `tmp/`, `temp/` - Temporary directories

### 💾 Database Files

- `*.db`, `*.sqlite*` - Local database files
- `dump.rdb` - Redis dump files

### 🖥️ Operating System

- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- `*~` (Linux backup files)

### 📱 Platform Specific

- `.vercel` - Vercel deployment
- `.turbo` - Turbo build cache
- `.pm2` - PM2 process manager

## Build Artifacts Cleanup

### Manual Cleanup

```bash
# Clean all build artifacts
npm run clean

# Clean and rebuild
npm run clean:build
```

### Automatic Cleanup

The following directories are automatically ignored and will be recreated during build:

- `backend/dist/` - TypeScript compilation
- `frontend/.next/` - Next.js build
- `frontend/.swc/` - SWC cache

## Development Workflow

### First Time Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Build artifacts will be created in ignored directories

### Daily Development

- Build artifacts are automatically ignored
- Environment files (`.env`) are ignored - copy from `.env.example`
- IDE settings are ignored - configure locally

### Before Committing

- Build artifacts are automatically excluded
- Check `git status` to ensure no sensitive files are staged
- Use `npm run clean` if you need to reset build state

## Customization

### Adding New Ignore Patterns

Add patterns to `.gitignore` following the existing categories:

```gitignore
# Your Category
pattern/
*.extension
```

### Workspace-Specific Ignores

For workspace-specific ignores, you can create:

- `frontend/.gitignore` - Frontend-only ignores
- `backend/.gitignore` - Backend-only ignores

### Local Ignores (Not Committed)

Use `.git/info/exclude` for personal ignore patterns that shouldn't be shared.

## Troubleshooting

### File Still Tracked After Adding to .gitignore

```bash
# Remove from tracking but keep local file
git rm --cached filename

# Remove directory from tracking
git rm -r --cached directory/
```

### Accidentally Committed Build Artifacts

```bash
# Remove from current commit
git reset HEAD filename

# Remove from history (use carefully)
git filter-branch --index-filter 'git rm --cached --ignore-unmatch filename'
```

### Check What's Ignored

```bash
# Check if file would be ignored
git check-ignore filename

# List all ignored files
git ls-files --others --ignored --exclude-standard
```

## Best Practices

1. **Never commit sensitive data** - Use environment variables
2. **Keep build artifacts out** - They can be regenerated
3. **Ignore IDE settings** - Let developers use their preferred setup
4. **Regular cleanup** - Use `npm run clean` periodically
5. **Review before commit** - Check `git status` before committing

## Related Files

- `.gitignore` - Main ignore configuration
- `scripts/clean.js` - Build cleanup script
- `.env.example` - Environment variable template
- `package.json` - Contains cleanup scripts
