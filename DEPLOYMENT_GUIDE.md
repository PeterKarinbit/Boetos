# Boetos Deployment Guide

This guide will help you deploy your Boetos application (frontend + backend) and connect them properly.

## Prerequisites

- Git installed
- Node.js and npm installed
- Accounts on deployment platforms (Netlify, Render/Railway/Heroku)

## Quick Start

1. **Run the deployment script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Follow the step-by-step deployment process below**

## Step-by-Step Deployment

### 1. Backend Deployment

#### Option A: Deploy to Render (Recommended)

1. **Sign up/Login to Render** (https://render.com)
2. **Create a new Web Service**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name:** `boetos-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free

5. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   SESSION_SECRET=your-secret-key
   FRONTEND_URL=https://your-frontend-app.netlify.app
   DATABASE_URL=your-database-url
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   JWT_SECRET=your-jwt-secret
   RESEND_API_KEY=your-resend-api-key
   ELEVENLABS_API_KEY=your-elevenlabs-api-key
   OPENROUTER_API_KEY=your-openrouter-api-key
   ONESIGNAL_APP_ID=your-onesignal-app-id
   ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key
   ```

6. **Deploy and get your backend URL** (e.g., `https://boetos-backend.onrender.com`)

#### Option B: Deploy to Railway

1. **Sign up/Login to Railway** (https://railway.app)
2. **Create a new project**
3. **Connect your GitHub repository**
4. **Add environment variables** (same as above)
5. **Deploy and get your backend URL**

#### Option C: Deploy to Heroku

1. **Install Heroku CLI**
2. **Login to Heroku:**
   ```bash
   heroku login
   ```

3. **Create a new app:**
   ```bash
   heroku create boetos-backend
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-secret-key
   heroku config:set FRONTEND_URL=https://your-frontend-app.netlify.app
   # ... add all other environment variables
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

### 2. Frontend Deployment

#### Deploy to Netlify

1. **Sign up/Login to Netlify** (https://netlify.com)
2. **Create a new site from Git**
3. **Connect your GitHub repository**
4. **Configure build settings:**
   - **Build command:** `cd frontend && npm install && npm run build`
   - **Publish directory:** `frontend/dist`
   - **Node version:** `18.0.0`

5. **Set Environment Variables:**
   ```
   VITE_BACKEND_URL=https://your-backend-app.onrender.com
   ```

6. **Deploy and get your frontend URL** (e.g., `https://boetos-frontend.netlify.app`)

### 3. Connect Frontend and Backend

1. **Update Backend Environment Variables:**
   - Go to your backend deployment platform
   - Update `FRONTEND_URL` with your actual Netlify URL

2. **Update Frontend Environment Variables:**
   - Go to Netlify dashboard
   - Update `VITE_BACKEND_URL` with your actual backend URL

3. **Redeploy both services** to apply the changes

### 4. Test the Connection

1. **Visit your frontend URL**
2. **Try to log in or register**
3. **Check browser console for any CORS errors**
4. **Verify API calls are working**

## Troubleshooting

### Common Issues

#### CORS Errors
- Ensure `FRONTEND_URL` in backend matches your actual frontend URL
- Check that the frontend URL is in the allowed origins list

#### Environment Variables Not Working
- Make sure to redeploy after changing environment variables
- Check that variable names match exactly (case-sensitive)

#### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure your database is accessible from your deployment platform

#### Build Failures
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility

### Debug Commands

```bash
# Check backend logs
# Render: View logs in dashboard
# Railway: railway logs
# Heroku: heroku logs --tail

# Check frontend build
cd frontend
npm run build

# Test backend locally
cd backend
npm start
```

## Environment Variables Reference

### Backend Required Variables
- `NODE_ENV`: production
- `PORT`: 10000 (or platform default)
- `SESSION_SECRET`: Random string for session encryption
- `FRONTEND_URL`: Your Netlify frontend URL
- `DATABASE_URL`: Your PostgreSQL database URL
- `JWT_SECRET`: Random string for JWT token signing

### Backend Optional Variables
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `RESEND_API_KEY`: Resend email service API key
- `ELEVENLABS_API_KEY`: ElevenLabs voice API key
- `OPENROUTER_API_KEY`: OpenRouter AI API key
- `ONESIGNAL_APP_ID`: OneSignal push notification app ID
- `ONESIGNAL_REST_API_KEY`: OneSignal REST API key

### Frontend Required Variables
- `VITE_BACKEND_URL`: Your backend deployment URL

## Security Considerations

1. **Never commit sensitive environment variables to Git**
2. **Use strong, unique secrets for SESSION_SECRET and JWT_SECRET**
3. **Enable HTTPS on both frontend and backend**
4. **Regularly update dependencies for security patches**
5. **Monitor your application logs for suspicious activity**

## Support

If you encounter issues during deployment:
1. Check the troubleshooting section above
2. Review the logs from your deployment platform
3. Verify all environment variables are set correctly
4. Test the connection between frontend and backend 