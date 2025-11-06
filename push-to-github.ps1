# GitHub Push Script untuk Windows PowerShell
# Jalankan script ini setelah membuat repository di GitHub

Write-Host "🚀 PUSH TO GITHUB SCRIPT" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

# First, check if GitHub repository exists
Write-Host "🔍 Checking GitHub repository..." -ForegroundColor Cyan
$repoCheck = Invoke-WebRequest -Uri "https://api.github.com/repos/hafarna/final-foto-video-creation" -Method GET -ErrorAction SilentlyContinue
if ($repoCheck.StatusCode -ne 200) {
    Write-Host "❌ Repository GitHub belum ada!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🆕 CARA MEMBUAT REPOSITORY:" -ForegroundColor Yellow
    Write-Host "1. Kunjungi: https://github.com/new" -ForegroundColor White
    Write-Host "2. Repository name: final-foto-video-creation" -ForegroundColor White
    Write-Host "3. Description: AI-powered multimedia content creation platform" -ForegroundColor White
    Write-Host "4. Pilih Public" -ForegroundColor White
    Write-Host "5. ❌ JANGAN centang README, .gitignore, atau license" -ForegroundColor Red
    Write-Host "6. Klik 'Create repository'" -ForegroundColor White
    Write-Host "7. Jalankan script ini lagi setelah repository dibuat" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Lihat CREATE_GITHUB_REPO.md untuk panduan lengkap" -ForegroundColor Cyan
    
    $openBrowser = Read-Host "Buka https://github.com/new sekarang? (y/N)"
    if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
        Start-Process "https://github.com/new"
    }
    exit 1
}

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Git repository belum di-initialize!" -ForegroundColor Red
    Write-Host "   Jalankan 'git init' terlebih dahulu" -ForegroundColor Yellow
    exit 1
}

# Check if there are commits
$commits = git log --oneline 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Belum ada commit!" -ForegroundColor Red
    Write-Host "   Jalankan 'git add .' dan 'git commit -m \"Initial commit\"' terlebih dahulu" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Git repository sudah siap" -ForegroundColor Green
Write-Host "📊 Commits yang tersedia:" -ForegroundColor Cyan
git log --oneline -5

Write-Host ""
Write-Host "🔗 SETUP REMOTE ORIGIN" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow

# Check if remote origin exists
$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Remote origin sudah terkonfigurasi: $remote" -ForegroundColor Green
} else {
    Write-Host "⚠️  Remote origin belum terkonfigurasi" -ForegroundColor Yellow
    Write-Host "   Pastikan repository GitHub sudah dibuat di: https://github.com/hafarna/final-foto-video-creation" -ForegroundColor Cyan
    
    $confirm = Read-Host "Apakah repository GitHub sudah dibuat? (y/N)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        git remote add origin https://github.com/hafarna/final-foto-video-creation.git
        Write-Host "✅ Remote origin berhasil ditambahkan" -ForegroundColor Green
    } else {
        Write-Host "❌ Silakan buat repository GitHub terlebih dahulu:" -ForegroundColor Red
        Write-Host "   1. Kunjungi: https://github.com/new" -ForegroundColor Yellow
        Write-Host "   2. Repository name: final-foto-video-creation" -ForegroundColor Yellow
        Write-Host "   3. Jangan centang README, .gitignore, atau license" -ForegroundColor Yellow
        Write-Host "   4. Klik 'Create repository'" -ForegroundColor Yellow
        Write-Host "   5. Jalankan script ini lagi" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 PUSH TO GITHUB" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow

# Rename branch to main
git branch -M main

Write-Host "📤 Pushing ke GitHub..." -ForegroundColor Cyan
$pushResult = git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Repository berhasil di-push ke GitHub!" -ForegroundColor Green
    Write-Host "🔗 Repository URL: https://github.com/hafarna/final-foto-video-creation" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎯 LANGKAH SELANJUTNYA:" -ForegroundColor Yellow
    Write-Host "1. 🌐 Deploy ke Vercel:" -ForegroundColor White
    Write-Host "   - Kunjungi https://vercel.com/new" -ForegroundColor Gray
    Write-Host "   - Import repository GitHub Anda" -ForegroundColor Gray  
    Write-Host "   - Set environment variable GEMINI_API_KEY" -ForegroundColor Gray
    Write-Host "   - Deploy!" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. 📝 Update README badges dengan URL Vercel yang benar" -ForegroundColor White
    Write-Host "3. 🎊 Share aplikasi Anda dengan dunia!" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ PUSH GAGAL!" -ForegroundColor Red
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $pushResult -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 SOLUSI UMUM:" -ForegroundColor Yellow
    Write-Host "1. Pastikan repository GitHub sudah dibuat" -ForegroundColor White
    Write-Host "2. Check authentication (GitHub token/SSH key)" -ForegroundColor White
    Write-Host "3. Pastikan tidak ada file dengan nama sama di GitHub" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Lihat GITHUB_PUSH.md untuk panduan lengkap" -ForegroundColor Cyan