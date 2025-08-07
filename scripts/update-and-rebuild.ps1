# PowerShell script for updating and rebuilding TrafikskolaX

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$Purple = "Magenta"
$Cyan = "Cyan"
$White = "White"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Write-Header {
    param([string]$Title)
    Write-Host "================================" -ForegroundColor $Purple
    Write-Host $Title -ForegroundColor $Purple
    Write-Host "================================" -ForegroundColor $Purple
}

# Function to check if we're in a git repository
function Test-GitRepo {
    if (-not (Test-Path ".git")) {
        Write-Error "Not in a git repository. Please run this script from the project root."
        exit 1
    }
}

# Function to check current branch
function Test-CurrentBranch {
    $currentBranch = git branch --show-current
    Write-Status "Current branch: $currentBranch"
    
    if ($currentBranch -ne "main" -and $currentBranch -ne "master") {
        Write-Warning "You're not on main/master branch. Current branch: $currentBranch"
        $response = Read-Host "Do you want to continue? (y/N)"
        if ($response -notmatch "^[Yy]$") {
            Write-Status "Aborting..."
            exit 1
        }
    }
}

# Function to check for uncommitted changes
function Test-UncommittedChanges {
    $status = git status --porcelain
    if ($status) {
        Write-Warning "You have uncommitted changes:"
        git status --short
        
        $response = Read-Host "Do you want to stash them before pulling? (y/N)"
        if ($response -match "^[Yy]$") {
            Write-Status "Stashing changes..."
            git stash push -m "Auto-stash before update $(Get-Date)"
            $script:STASHED = $true
        } else {
            Write-Error "Please commit or stash your changes before updating."
            exit 1
        }
    }
}

# Function to perform git pull
function Invoke-GitPull {
    Write-Header "Pulling latest changes from remote"
    
    Write-Status "Fetching latest changes..."
    if (-not (git fetch origin)) {
        Write-Error "Failed to fetch from remote"
        exit 1
    }
    
    Write-Status "Pulling changes..."
    $currentBranch = git branch --show-current
    if (-not (git pull origin $currentBranch)) {
        Write-Error "Failed to pull changes"
        exit 1
    }
    
    Write-Success "Git pull completed successfully"
}

# Function to check for new dependencies
function Test-NewDependencies {
    Write-Header "Checking for new dependencies"
    
    # Check if package.json or package-lock.json changed
    $changedFiles = git diff --name-only HEAD~1 HEAD
    if ($changedFiles -match "(package\.json|package-lock\.json)") {
        Write-Status "Dependencies have changed, installing new packages..."
        
        # Remove node_modules and package-lock.json for clean install
        if (Test-Path "node_modules") {
            Write-Status "Removing existing node_modules..."
            Remove-Item -Recurse -Force "node_modules"
        }
        
        if (Test-Path "package-lock.json") {
            Write-Status "Removing existing package-lock.json..."
            Remove-Item "package-lock.json"
        }
        
        # Install dependencies
        Write-Status "Installing dependencies..."
        if (-not (npm install)) {
            Write-Error "Failed to install dependencies"
            exit 1
        }
        
        Write-Success "Dependencies installed successfully"
        $script:REBUILD_NEEDED = $true
    } else {
        Write-Status "No dependency changes detected"
    }
}

# Function to check for build-related changes
function Test-BuildChanges {
    Write-Header "Checking for build-related changes"
    
    # Check if any source files, config files, or build-related files changed
    $changedFiles = git diff --name-only HEAD~1 HEAD
    if ($changedFiles -match "\.(tsx?|jsx?|json|mjs|css|scss|md|yml|yaml|config\.js|next\.config\.mjs)") {
        Write-Status "Source files have changed, rebuild will be needed"
        $script:REBUILD_NEEDED = $true
    } else {
        Write-Status "No source file changes detected"
    }
}

# Function to rebuild the application
function Invoke-RebuildApplication {
    if ($script:REBUILD_NEEDED) {
        Write-Header "Rebuilding application"
        
        # Clear Next.js cache
        Write-Status "Clearing Next.js cache..."
        if (Test-Path ".next") {
            Remove-Item -Recurse -Force ".next"
        }
        
        # Build the application
        Write-Status "Building application..."
        if (-not (npm run build)) {
            Write-Error "Build failed"
            exit 1
        }
        
        Write-Success "Application rebuilt successfully"
    } else {
        Write-Status "No rebuild needed"
    }
}

# Function to restart PM2 processes (if running)
function Restart-PM2Processes {
    Write-Header "Restarting PM2 processes"
    
    # Check if PM2 is installed
    try {
        $null = Get-Command pm2 -ErrorAction Stop
    } catch {
        Write-Warning "PM2 not found, skipping PM2 restart"
        return
    }
    
    # Check if there are any PM2 processes for this app
    $appName = (Get-Item .).Name
    $pm2List = pm2 list
    if ($pm2List -match $appName) {
        Write-Status "Restarting PM2 processes..."
        pm2 restart all
        Write-Success "PM2 processes restarted"
    } else {
        Write-Status "No PM2 processes found for this application"
    }
}

# Function to restart development server (if running)
function Restart-DevServer {
    Write-Header "Development server status"
    
    # Check if there's a development server running
    $devProcesses = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*npm run dev*" }
    if ($devProcesses) {
        Write-Status "Development server is running"
        $response = Read-Host "Do you want to restart the development server? (y/N)"
        if ($response -match "^[Yy]$") {
            Write-Status "Restarting development server..."
            Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
            Write-Success "Development server restarted"
        }
    } else {
        Write-Status "No development server running"
    }
}

# Function to restore stashed changes
function Restore-StashedChanges {
    if ($script:STASHED) {
        Write-Header "Restoring stashed changes"
        
        $stashList = git stash list
        if ($stashList -match "Auto-stash before update") {
            Write-Status "Restoring stashed changes..."
            if (git stash pop) {
                Write-Success "Stashed changes restored"
            } else {
                Write-Warning "Failed to restore stashed changes. You can restore them manually with 'git stash pop'"
            }
        }
    }
}

# Function to show summary
function Show-Summary {
    Write-Header "Update Summary"
    
    $commitCount = (git log --oneline HEAD~1..HEAD).Count
    Write-Host "Changes pulled: $commitCount commits" -ForegroundColor $Cyan
    Write-Host "Dependencies updated: $(if ($script:REBUILD_NEEDED) { 'Yes' } else { 'No' })" -ForegroundColor $Cyan
    Write-Host "Application rebuilt: $(if ($script:REBUILD_NEEDED) { 'Yes' } else { 'No' })" -ForegroundColor $Cyan
    Write-Host "PM2 restarted: $(if ($script:PM2_RESTARTED) { 'Yes' } else { 'No' })" -ForegroundColor $Cyan
    
    Write-Success "Update completed successfully!"
}

# Main execution
function Main {
    Write-Header "TrafikskolaX Update Script"
    
    # Initialize variables
    $script:STASHED = $false
    $script:REBUILD_NEEDED = $false
    $script:PM2_RESTARTED = $false
    
    # Check prerequisites
    Test-GitRepo
    Test-CurrentBranch
    Test-UncommittedChanges
    
    # Perform update
    Invoke-GitPull
    Test-NewDependencies
    Test-BuildChanges
    Invoke-RebuildApplication
    
    # Restart services
    Restart-PM2Processes
    $script:PM2_RESTARTED = $true
    Restart-DevServer
    
    # Restore changes if needed
    Restore-StashedChanges
    
    # Show summary
    Show-Summary
}

# Run main function
Main
