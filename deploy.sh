#!/bin/bash
# Deployment script untuk Vercel

echo "🚀 Memulai deployment ke Vercel..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: File .env tidak ditemukan!"
    echo "📝 Silakan buat file .env dengan template dari .env.example"
    exit 1
fi

# Check if GEMINI_API_KEY is set
if ! grep -q "GEMINI_API_KEY=" .env; then
    echo "❌ Error: GEMINI_API_KEY tidak ditemukan di .env!"
    echo "📝 Silakan tambahkan GEMINI_API_KEY ke file .env"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build output tersedia di folder 'dist/'"
    
    # Check if vercel CLI is installed
    if command -v vercel &> /dev/null; then
        echo "🚀 Deploying to Vercel..."
        vercel --prod
    else
        echo "💡 Untuk deploy otomatis, install Vercel CLI:"
        echo "   npm i -g vercel"
        echo "   vercel login"
        echo "   vercel --prod"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi