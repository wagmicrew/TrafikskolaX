#!/bin/bash

# Make database cleanup scripts executable

echo "🔧 Making database cleanup scripts executable..."

# List of scripts to make executable
scripts=(
    "remove-safe-tables.js"
    "verify-table-removal.js"
    "dry-run-table-removal.js"
)

# Make each script executable
for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        echo "✅ Made $script executable"
    else
        echo "⚠️  $script not found"
    fi
done

echo ""
echo "📋 Available commands:"
echo "  • ./scripts/dry-run-table-removal.js     - See what would happen"
echo "  • ./scripts/verify-table-removal.js      - Check database state"
echo "  • ./scripts/remove-safe-tables.js --yes  - Perform actual removal"
echo ""
echo "📖 Read the documentation:"
echo "  • scripts/README-table-removal.md"
echo "  • Documentation_new/database-tables-analysis.md"
echo ""
echo "🎯 Always create a backup before removing tables!"
