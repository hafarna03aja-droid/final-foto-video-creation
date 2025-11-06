@echo off
REM Deployment script untuk Vercel (Windows)

echo 🚀 Memulai deployment ke Vercel...

REM Check if .env file exists
if not exist .env (
    echo ❌ Error: File .env tidak ditemukan!
    echo 📝 Silakan buat file .env dengan template dari .env.example
    exit /b 1
)

REM Check if GEMINI_API_KEY is set
findstr /C:"GEMINI_API_KEY=" .env >nul
if errorlevel 1 (
    echo ❌ Error: GEMINI_API_KEY tidak ditemukan di .env!
    echo 📝 Silakan tambahkan GEMINI_API_KEY ke file .env
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the project
echo 🔨 Building project...
npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful!
    echo 📁 Build output tersedia di folder 'dist/'
    
    REM Check if vercel CLI is available
    where vercel >nul 2>nul
    if %errorlevel% equ 0 (
        echo 🚀 Deploying to Vercel...
        vercel --prod
    ) else (
        echo 💡 Untuk deploy otomatis, install Vercel CLI:
        echo    npm i -g vercel
        echo    vercel login
        echo    vercel --prod
    )
) else (
    echo ❌ Build failed!
    exit /b 1
)