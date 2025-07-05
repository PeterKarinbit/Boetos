# Boetos Deployment Script for Windows
Write-Host "🚀 Starting Boetos Deployment Process..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if required tools are installed
function Test-Requirements {
    Write-Status "Checking deployment requirements..."
    
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "Git is not installed. Please install Git first."
        exit 1
    }
    
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed. Please install Node.js first."
        exit 1
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is not installed. Please install npm first."
        exit 1
    }
    
    Write-Success "All requirements are met!"
}

# Deploy Backend
function Deploy-Backend {
    Write-Status "Deploying Backend..."
    
    Set-Location backend
    
    # Install dependencies
    Write-Status "Installing backend dependencies..."
    npm install
    
    # Build the project
    Write-Status "Building backend..."
    npm run build
    
    Write-Success "Backend built successfully!"
    Write-Warning "Please deploy your backend to a platform like Render, Railway, or Heroku"
    Write-Warning "Update the FRONTEND_URL in your backend environment variables"
    
    Set-Location ..
}

# Deploy Frontend
function Deploy-Frontend {
    Write-Status "Deploying Frontend..."
    
    Set-Location frontend
    
    # Install dependencies
    Write-Status "Installing frontend dependencies..."
    npm install
    
    # Build the project
    Write-Status "Building frontend..."
    npm run build
    
    Write-Success "Frontend built successfully!"
    Write-Warning "Please deploy your frontend to Netlify"
    Write-Warning "Update the VITE_BACKEND_URL in your frontend environment variables"
    
    Set-Location ..
}

# Main deployment process
function Main {
    Write-Status "Starting deployment process..."
    
    # Check requirements
    Test-Requirements
    
    # Deploy backend
    Deploy-Backend
    
    # Deploy frontend
    Deploy-Frontend
    
    Write-Success "Deployment process completed!"
    Write-Status "Next steps:"
    Write-Host "1. Deploy backend to Render/Railway/Heroku"
    Write-Host "2. Deploy frontend to Netlify"
    Write-Host "3. Update environment variables with correct URLs"
    Write-Host "4. Test the connection between frontend and backend"
}

# Run main function
Main 