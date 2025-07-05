# Production Environment Setup Script
Write-Host "Setting up Production Environment Variables..." -ForegroundColor Green

# Generate secure secrets
Write-Host "Generating secure secrets..." -ForegroundColor Blue

# Generate session secret
$sessionSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Write-Host "Generated SESSION_SECRET: $sessionSecret" -ForegroundColor Yellow

# Generate JWT secret
$jwtSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Write-Host "Generated JWT_SECRET: $jwtSecret" -ForegroundColor Yellow

Write-Host "BACKEND ENVIRONMENT VARIABLES (for Render/Railway/Heroku):" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "NODE_ENV=production" -ForegroundColor White
Write-Host "PORT=10000" -ForegroundColor White
Write-Host "SESSION_SECRET=$sessionSecret" -ForegroundColor White
Write-Host "JWT_SECRET=$jwtSecret" -ForegroundColor White
Write-Host "FRONTEND_URL=https://your-frontend-app.netlify.app" -ForegroundColor White
Write-Host "DATABASE_URL=your-production-postgresql-url" -ForegroundColor White
Write-Host "GOOGLE_CLIENT_ID=711853017179-ii096p73iqmfsibdopf58t9e5j4gvpes.apps.googleusercontent.com" -ForegroundColor White
Write-Host "GOOGLE_CLIENT_SECRET=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" -ForegroundColor White
Write-Host "GOOGLE_CALLBACK_URL=https://your-backend-app.onrender.com/api/oauth/google/callback" -ForegroundColor White
Write-Host "OPENROUTER_API_KEY=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" -ForegroundColor White
Write-Host "ELEVENLABS_API_KEY=sk_3e605a6562fbd7f3fc36745099dca62bba03c09a4bdf2a97" -ForegroundColor White
Write-Host "RESEND_API_KEY=re_6NTVnyFK_Gb6EHTHWW1YAavqPxxSaTUR2" -ForegroundColor White
Write-Host "GOOGLE_API_KEY=AIzaSyBa8QC8T1R__z05KwEVQduHX2bInWCivbE" -ForegroundColor White
Write-Host "ONESIGNAL_APP_ID=36ea6058-6843-4080-b67d-811dc96c1783" -ForegroundColor White
Write-Host "ONESIGNAL_REST_API_KEY=os_v2_app_g3vgawdiinaibnt5qeo4s3axqpxtfwzbwwfuvhvdi4a76dzcp5mothtsfz3hhbee5yqlqaba4vdqivzz5biqbl3fyqnzx7oamamd5by" -ForegroundColor White

Write-Host "FRONTEND ENVIRONMENT VARIABLES (for Netlify):" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "VITE_BACKEND_URL=https://your-backend-app.onrender.com" -ForegroundColor White
Write-Host "VITE_APP_NAME=Boetos" -ForegroundColor White
Write-Host "VITE_APP_ENV=production" -ForegroundColor White
Write-Host "VITE_GOOGLE_CLIENT_ID=711853017179-ii096p73iqmfsibdopf58t9e5j4gvpes.apps.googleusercontent.com" -ForegroundColor White
Write-Host "VITE_GOOGLE_REDIRECT_URIS=https://your-frontend-app.netlify.app" -ForegroundColor White
Write-Host "VITE_GOOGLE_JAVASCRIPT_ORIGINS=https://your-frontend-app.netlify.app" -ForegroundColor White

Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Red
Write-Host "1. Update Google OAuth Console with production URLs" -ForegroundColor Yellow
Write-Host "2. Set up a production PostgreSQL database" -ForegroundColor Yellow
Write-Host "3. Replace 'your-backend-app.onrender.com' with actual backend URL" -ForegroundColor Yellow
Write-Host "4. Replace 'your-frontend-app.netlify.app' with actual frontend URL" -ForegroundColor Yellow
Write-Host "5. Replace 'your-production-postgresql-url' with actual database URL" -ForegroundColor Yellow

Write-Host "Environment variables generated successfully!" -ForegroundColor Green 