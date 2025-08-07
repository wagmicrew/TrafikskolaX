# TrafikskolaX Update Scripts

This directory contains scripts to automatically update and rebuild the TrafikskolaX application after pulling changes from git.

## Available Scripts

### 1. `update-and-rebuild.sh` (Linux/macOS)
A comprehensive bash script for Unix-based systems.

**Usage:**
```bash
# Make executable (first time only)
chmod +x scripts/update-and-rebuild.sh

# Run the script
./scripts/update-and-rebuild.sh
```

### 2. `update-and-rebuild.ps1` (Windows PowerShell)
A PowerShell script for Windows systems.

**Usage:**
```powershell
# Run the script
.\scripts\update-and-rebuild.ps1
```

### 3. `update-and-rebuild.bat` (Windows Command Prompt)
A batch file for Windows Command Prompt users.

**Usage:**
```cmd
# Run the script
scripts\update-and-rebuild.bat
```

## What the Scripts Do

### Prerequisites Check
- ✅ Verifies you're in a git repository
- ✅ Checks current branch (warns if not on main/master)
- ✅ Detects uncommitted changes and offers to stash them

### Git Operations
- 🔄 Fetches latest changes from remote
- 🔄 Pulls changes from current branch
- 🔄 Handles merge conflicts gracefully

### Dependency Management
- 📦 Detects changes in `package.json` or `package-lock.json`
- 📦 Removes existing `node_modules` and `package-lock.json` for clean install
- 📦 Installs new dependencies with `npm install`

### Build Process
- 🔍 Detects changes in source files (`.tsx`, `.ts`, `.jsx`, `.js`, etc.)
- 🧹 Clears Next.js cache (`.next` directory)
- 🔨 Rebuilds application with `npm run build`

### Service Management
- 🔄 Restarts PM2 processes (if running)
- 🔄 Offers to restart development server (if running)
- 🔄 Restores stashed changes (if any were stashed)

### Summary Report
- 📊 Shows number of commits pulled
- 📊 Reports if dependencies were updated
- 📊 Reports if application was rebuilt
- 📊 Reports if PM2 was restarted

## Features

### 🛡️ Safety Features
- **Uncommitted Changes**: Detects and offers to stash changes before pulling
- **Branch Check**: Warns if not on main/master branch
- **Error Handling**: Stops execution on critical errors
- **Clean State**: Ensures clean dependency installation

### 🚀 Smart Rebuilding
- **Dependency Detection**: Only rebuilds if dependencies changed
- **Source File Detection**: Only rebuilds if source files changed
- **Cache Clearing**: Clears Next.js cache before rebuilding

### 🎨 User Experience
- **Colored Output**: Easy-to-read colored status messages
- **Progress Indicators**: Clear progress through each step
- **Interactive Prompts**: Asks for confirmation on important decisions
- **Summary Report**: Shows what was accomplished

## Error Handling

The scripts handle various error scenarios:

- ❌ **Not in git repository**: Exits with clear error message
- ❌ **Git fetch/pull fails**: Exits with error details
- ❌ **Dependency installation fails**: Exits with error details
- ❌ **Build fails**: Exits with error details
- ⚠️ **Uncommitted changes**: Offers to stash or abort
- ⚠️ **Wrong branch**: Warns and asks for confirmation

## Best Practices

### Before Running
1. **Commit your changes** or be prepared to stash them
2. **Ensure you're on the correct branch** (main/master)
3. **Backup important work** if needed

### After Running
1. **Test the application** to ensure it works correctly
2. **Check PM2 status** if using PM2: `pm2 status`
3. **Monitor logs** for any issues: `pm2 logs`

## Troubleshooting

### Common Issues

**Script fails with "Not in git repository"**
- Make sure you're running the script from the project root directory
- Verify that `.git` directory exists

**Build fails after update**
- Check if all dependencies are installed: `npm install`
- Clear cache manually: `rm -rf .next` (Linux/macOS) or `rmdir /s .next` (Windows)
- Check for TypeScript errors: `npm run type-check`

**PM2 processes not restarting**
- Check if PM2 is installed: `pm2 --version`
- List PM2 processes: `pm2 list`
- Restart manually: `pm2 restart all`

**Development server issues**
- Kill existing processes: `pkill -f "npm run dev"` (Linux/macOS)
- Start manually: `npm run dev`

### Manual Recovery

If the script fails, you can manually perform the steps:

```bash
# 1. Pull changes
git pull origin main

# 2. Install dependencies (if needed)
npm install

# 3. Rebuild (if needed)
rm -rf .next
npm run build

# 4. Restart services
pm2 restart all
```

## Platform-Specific Notes

### Linux/macOS
- Uses bash with colored output
- Handles Unix-style process management
- Uses `chmod +x` for execution permissions

### Windows PowerShell
- Uses PowerShell with colored output
- Handles Windows process management
- May require execution policy adjustment: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Windows Command Prompt
- Uses batch file syntax
- Limited color support
- Uses Windows-specific commands

## Contributing

When modifying these scripts:

1. **Test on all platforms** if possible
2. **Maintain backward compatibility**
3. **Add clear error messages**
4. **Update this README** with any changes
5. **Follow the existing code style**

## Version History

- **v1.0**: Initial release with basic git pull and rebuild functionality
- **v1.1**: Added dependency detection and smart rebuilding
- **v1.2**: Added PM2 and development server management
- **v1.3**: Added comprehensive error handling and user prompts
