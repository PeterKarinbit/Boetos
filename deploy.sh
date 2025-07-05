#!/bin/bash

echo "🚀 Starting Boetos Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required tools are installed
check_requirements() {
    print_status "Checking deployment requirements..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All requirements are met!"
}

# Deploy Backend
deploy_backend() {
    print_status "Deploying Backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Build the project
    print_status "Building backend..."
    npm run build
    
    print_success "Backend built successfully!"
    print_warning "Please deploy your backend to a platform like Render, Railway, or Heroku"
    print_warning "Update the FRONTEND_URL in your backend environment variables"
    
    cd ..
}

# Deploy Frontend
deploy_frontend() {
    print_status "Deploying Frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the project
    print_status "Building frontend..."
    npm run build
    
    print_success "Frontend built successfully!"
    print_warning "Please deploy your frontend to Netlify"
    print_warning "Update the VITE_BACKEND_URL in your frontend environment variables"
    
    cd ..
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    # Check requirements
    check_requirements
    
    # Deploy backend
    deploy_backend
    
    # Deploy frontend
    deploy_frontend
    
    print_success "Deployment process completed!"
    print_status "Next steps:"
    echo "1. Deploy backend to Render/Railway/Heroku"
    echo "2. Deploy frontend to Netlify"
    echo "3. Update environment variables with correct URLs"
    echo "4. Test the connection between frontend and backend"
}

# Run main function
main 