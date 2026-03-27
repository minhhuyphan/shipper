#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick setup script for Shipper Backend

.DESCRIPTION
    Automates the initial setup process:
    1. Copy .env.example to .env
    2. Install dependencies
    3. Provide MongoDB connection options
    
.EXAMPLE
    .\setup.ps1
#>

Write-Host "`n🚀 SHIPPER BACKEND SETUP" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Step 1: Check if .env exists
Write-Host "[1/3] Checking configuration..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "✅ .env file already exists (skipping copy)" -ForegroundColor Green
} else {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env" -Force
        Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example not found in $(Get-Location)" -ForegroundColor Red
        Write-Host "   Make sure you're in the 'server' directory" -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Install dependencies
Write-Host "`n[2/3] Installing dependencies..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    Write-Host "✅ node_modules already exists (skipping npm install)" -ForegroundColor Green
} else {
    Write-Host "Running: npm install" -ForegroundColor Blue
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        exit 1
    }
}

# Step 3: MongoDB connection setup
Write-Host "`n[3/3] MongoDB Setup Guide" -ForegroundColor Yellow
Write-Host @"
╔════════════════════════════════════════════════════════════╗
║  Choose your MongoDB connection method:                   ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  [1] MongoDB Atlas (Cloud) ⭐ RECOMMENDED                  ║
║      → Free tier, no installation needed                  ║
║      → Visit: https://www.mongodb.com/cloud/atlas         ║
║      → Connection: mongodb+srv://user:pass@cluster...     ║
║                                                            ║
║  [2] Docker (Requires Docker Desktop)                    ║
║      → Run: docker run -d --name mongodb -p 27017:27017   ║
║             -e MONGO_INITDB_ROOT_USERNAME=admin           ║
║             -e MONGO_INITDB_ROOT_PASSWORD=admin123 mongo  ║
║      → Connection: mongodb://admin:admin123@localhost...  ║
║                                                            ║
║  [3] Local MongoDB (Windows Installation)                ║
║      → Download: https://www.mongodb.com/try/download     ║
║      → Connection: mongodb://localhost:27017/...          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n📝 Next Steps:" -ForegroundColor Green
Write-Host "1️⃣  Edit .env file and update MONGODB_URI"
Write-Host "2️⃣  Update JWT_SECRET to a strong random string"
Write-Host "3️⃣  Run: npm run dev (to start development server)"
Write-Host "`nℹ️  Default credentials (after running seed):"
Write-Host "   Email: admin@example.com"
Write-Host "   Password: password123"
Write-Host "`n📚 API Docs: http://localhost:5000/api-docs (nach npm run dev)`n"

Write-Host "✅ Setup complete! Edit .env and run 'npm run dev'" -ForegroundColor Green
