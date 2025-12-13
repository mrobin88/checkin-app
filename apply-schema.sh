#!/bin/bash

# CheckIn App - Database Setup Script
# This script applies the database schema using Supabase CLI

echo "🚀 CheckIn App - Database Setup"
echo "================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found."
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or on Mac:"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found"
    echo ""
    echo "Create a .env file with:"
    echo "  VITE_SUPABASE_URL=your_url"
    echo "  VITE_SUPABASE_ANON_KEY=your_key"
    echo ""
fi

# Link to Supabase project
echo "Linking to your Supabase project..."
echo ""
echo "You'll need:"
echo "1. Your project reference ID (from Supabase dashboard URL)"
echo "2. Your database password"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Link project
supabase link

# Apply migrations
echo ""
echo "Applying database schema..."
echo ""

supabase db push --db-url "$SUPABASE_DB_URL" < SCHEMA_SIMPLE.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Enable Realtime on 'messages' and 'friendships' tables"
echo "2. Run: npm run dev"
echo "3. Open http://localhost:5173"
echo ""

