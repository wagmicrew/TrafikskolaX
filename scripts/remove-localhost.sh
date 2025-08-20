#!/bin/bash

# Script to find and remove localhost references from TrafikskolaX codebase
# This script helps ensure the project is production-ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to find localhost references
find_localhost_references() {
    print_status "Searching for localhost references in codebase..."
    
    # Search for localhost references (excluding node_modules, .git, .next, etc.)
    LOCALHOST_FILES=$(grep -r "localhost" . \
        --exclude-dir=node_modules \
        --exclude-dir=.git \
        --exclude-dir=.next \
        --exclude-dir=.turbo \
        --exclude=*.log \
        --exclude=*.lock \
        --exclude=package-lock.json \
        --exclude=yarn.lock \
        --exclude=pnpm-lock.yaml \
        2>/dev/null || true)
    
    if [ -n "$LOCALHOST_FILES" ]; then
        echo
        print_warning "Found localhost references in the following files:"
        echo "=========================================="
        echo "$LOCALHOST_FILES"
        echo "=========================================="
        echo
        return 0
    else
        print_success "No localhost references found in codebase"
        return 1
    fi
}

# Function to replace localhost references
replace_localhost_references() {
    local PRODUCTION_DOMAIN=${1:-"dintrafikskolahlm.se"}
    
    print_status "Replacing localhost references with production domain: $PRODUCTION_DOMAIN"
    
    # Files to process
    local FILE_TYPES="*.js *.ts *.tsx *.json *.env* *.md *.txt *.yml *.yaml"
    
    # Replace localhost:3000 with production domain
    print_status "Replacing localhost:3000 references..."
    find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.env*" -o -name "*.md" -o -name "*.txt" -o -name "*.yml" -o -name "*.yaml" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -not -path "./.next/*" \
        -not -path "./.turbo/*" \
        -not -name "package-lock.json" \
        -not -name "yarn.lock" \
        -not -name "pnpm-lock.yaml" \
        -exec sed -i "s/localhost:3000/$PRODUCTION_DOMAIN/g" {} \;
    
    # Replace localhost (without port) with production domain
    print_status "Replacing localhost references (without port)..."
    find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.env*" -o -name "*.md" -o -name "*.txt" -o -name "*.yml" -o -name "*.yaml" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -not -path "./.next/*" \
        -not -path "./.turbo/*" \
        -not -name "package-lock.json" \
        -not -name "yarn.lock" \
        -not -name "pnpm-lock.yaml" \
        -exec sed -i "s/localhost/$PRODUCTION_DOMAIN/g" {} \;
    
    print_success "Localhost references replaced with production domain"
}

# Function to show specific localhost references
show_specific_references() {
    print_status "Showing specific localhost references by file type..."
    
    echo
    echo "=== JavaScript/TypeScript Files ==="
    grep -r "localhost" . --include="*.js" --include="*.ts" --include="*.tsx" \
        --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=.turbo 2>/dev/null || echo "None found"
    
    echo
    echo "=== JSON Files ==="
    grep -r "localhost" . --include="*.json" \
        --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=.turbo \
        --exclude=package-lock.json 2>/dev/null || echo "None found"
    
    echo
    echo "=== Environment Files ==="
    grep -r "localhost" . --include="*.env*" \
        --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=.turbo 2>/dev/null || echo "None found"
    
    echo
    echo "=== Documentation Files ==="
    grep -r "localhost" . --include="*.md" --include="*.txt" \
        --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=.turbo 2>/dev/null || echo "None found"
}

# Function to create backup
create_backup() {
    local BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
    print_status "Creating backup in $BACKUP_DIR..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Copy files that might contain localhost references
    find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.env*" -o -name "*.md" -o -name "*.txt" -o -name "*.yml" -o -name "*.yaml" \) \
        -not -path "./node_modules/*" \
        -not -path "./.git/*" \
        -not -path "./.next/*" \
        -not -path "./.turbo/*" \
        -not -name "package-lock.json" \
        -not -name "yarn.lock" \
        -not -name "pnpm-lock.yaml" \
        -exec cp --parents {} "$BACKUP_DIR" \;
    
    print_success "Backup created in $BACKUP_DIR"
}

# Main function
main() {
    echo "=========================================="
    echo "    Localhost Reference Removal Tool"
    echo "=========================================="
    echo
    
    # Check if we're in the project directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the TrafikskolaX project root directory"
        exit 1
    fi
    
    case "${1:-}" in
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Options:"
            echo "  --help, -h           Show this help message"
            echo "  --find               Only find localhost references (don't replace)"
            echo "  --show               Show specific references by file type"
            echo "  --replace [domain]   Replace localhost references with domain (default: dintrafikskolahlm.se)"
            echo "  --backup             Create backup before making changes"
            echo "  --dry-run            Show what would be replaced without making changes"
            echo
            echo "Examples:"
            echo "  $0 --find                    # Find all localhost references"
            echo "  $0 --replace                 # Replace with default domain"
            echo "  $0 --replace example.com     # Replace with custom domain"
            echo "  $0 --backup --replace        # Create backup and replace"
            exit 0
            ;;
        --find)
            find_localhost_references
            ;;
        --show)
            show_specific_references
            ;;
        --replace)
            local PRODUCTION_DOMAIN=${2:-"dintrafikskolahlm.se"}
            
            if find_localhost_references; then
                echo
                read -p "Do you want to replace these localhost references with '$PRODUCTION_DOMAIN'? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    replace_localhost_references "$PRODUCTION_DOMAIN"
                    echo
                    print_status "Verifying changes..."
                    find_localhost_references || print_success "All localhost references have been replaced!"
                else
                    print_status "Operation cancelled"
                fi
            fi
            ;;
        --backup)
            create_backup
            ;;
        --dry-run)
            print_status "DRY RUN MODE - No changes will be made"
            echo "This would perform the following operations:"
            echo "  1. Find all localhost references"
            echo "  2. Replace localhost:3000 with production domain"
            echo "  3. Replace localhost (without port) with production domain"
            echo "  4. Verify changes"
            exit 0
            ;;
        "")
            # No arguments, show help
            echo "No arguments provided. Use --help for usage information."
            echo
            echo "Quick start:"
            echo "  $0 --find     # Find localhost references"
            echo "  $0 --replace  # Replace localhost references"
            exit 1
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
}

# Run the main function
main "$@"
