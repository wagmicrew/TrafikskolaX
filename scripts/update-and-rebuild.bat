@echo off
setlocal enabledelayedexpansion

echo ================================
echo TrafikskolaX Update Script
echo ================================

REM Check if we're in a git repository
if not exist ".git" (
    echo [ERROR] Not in a git repository. Please run this script from the project root.
    pause
    exit /b 1
)

REM Check current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo [INFO] Current branch: !CURRENT_BRANCH!

REM Check for uncommitted changes
git status --porcelain > temp_status.txt
set /p STATUS=<temp_status.txt
if not "!STATUS!"=="" (
    echo [WARNING] You have uncommitted changes:
    git status --short
    set /p STASH_CHOICE="Do you want to stash them before pulling? (y/N): "
    if /i "!STASH_CHOICE!"=="y" (
        echo [INFO] Stashing changes...
        git stash push -m "Auto-stash before update %date% %time%"
        set STASHED=true
    ) else (
        echo [ERROR] Please commit or stash your changes before updating.
        del temp_status.txt
        pause
        exit /b 1
    )
)
del temp_status.txt

REM Pull latest changes
echo ================================
echo Pulling latest changes from remote
echo ================================

echo [INFO] Fetching latest changes...
git fetch origin
if errorlevel 1 (
    echo [ERROR] Failed to fetch from remote
    pause
    exit /b 1
)

echo [INFO] Pulling changes...
git pull origin !CURRENT_BRANCH!
if errorlevel 1 (
    echo [ERROR] Failed to pull changes
    pause
    exit /b 1
)

echo [SUCCESS] Git pull completed successfully

REM Check for dependency changes
echo ================================
echo Checking for new dependencies
echo ================================

git diff --name-only HEAD~1 HEAD | findstr /i "package.json package-lock.json" > temp_deps.txt
set /p DEPS_CHANGED=<temp_deps.txt
if not "!DEPS_CHANGED!"=="" (
    echo [INFO] Dependencies have changed, installing new packages...
    
    if exist "node_modules" (
        echo [INFO] Removing existing node_modules...
        rmdir /s /q node_modules
    )
    
    if exist "package-lock.json" (
        echo [INFO] Removing existing package-lock.json...
        del package-lock.json
    )
    
    echo [INFO] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        del temp_deps.txt
        pause
        exit /b 1
    )
    
    echo [SUCCESS] Dependencies installed successfully
    set REBUILD_NEEDED=true
) else (
    echo [INFO] No dependency changes detected
)
del temp_deps.txt

REM Check for build changes
echo ================================
echo Checking for build-related changes
echo ================================

git diff --name-only HEAD~1 HEAD | findstr /i "\.tsx \.ts \.jsx \.js \.json \.mjs \.css \.scss \.md \.yml \.yaml config\.js next\.config\.mjs" > temp_build.txt
set /p BUILD_CHANGED=<temp_build.txt
if not "!BUILD_CHANGED!"=="" (
    echo [INFO] Source files have changed, rebuild will be needed
    set REBUILD_NEEDED=true
) else (
    echo [INFO] No source file changes detected
)
del temp_build.txt

REM Rebuild if needed
if "!REBUILD_NEEDED!"=="true" (
    echo ================================
    echo Rebuilding application
    echo ================================
    
    echo [INFO] Clearing Next.js cache...
    if exist ".next" rmdir /s /q .next
    
    echo [INFO] Building application...
    npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
    
    echo [SUCCESS] Application rebuilt successfully
) else (
    echo [INFO] No rebuild needed
)

REM Restart PM2 processes
echo ================================
echo Restarting PM2 processes
echo ================================

pm2 list > temp_pm2.txt 2>&1
findstr /i "TrafikskolaX" temp_pm2.txt > nul
if not errorlevel 1 (
    echo [INFO] Restarting PM2 processes...
    pm2 restart all
    echo [SUCCESS] PM2 processes restarted
) else (
    echo [INFO] No PM2 processes found for this application
)
del temp_pm2.txt

REM Show summary
echo ================================
echo Update Summary
echo ================================

for /f %%i in ('git log --oneline HEAD~1..HEAD ^| find /c /v ""') do set COMMIT_COUNT=%%i
echo Changes pulled: !COMMIT_COUNT! commits
echo Dependencies updated: !REBUILD_NEEDED!
echo Application rebuilt: !REBUILD_NEEDED!
echo PM2 restarted: Yes

echo [SUCCESS] Update completed successfully!
pause
