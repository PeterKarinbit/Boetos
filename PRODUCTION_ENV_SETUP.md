# Production Environment Variables Setup

## 🔒 IMPORTANT SECURITY NOTES

1. **NEVER commit these values to Git**
2. **Generate new secrets for production**
3. **Update Google OAuth redirect URIs for production domains**

## Backend Environment Variables (for Render/Railway/Heroku)

### Required Variables:
```
NODE_ENV=production
PORT=10000
SESSION_SECRET=generate-new-secret-key-here
FRONTEND_URL=https://your-frontend-app.netlify.app
DATABASE_URL=your-production-postgresql-url
JWT_SECRET=generate-new-jwt-secret-here
```

### Google OAuth (Update redirect URIs):
```
GOOGLE_CLIENT_ID=711853017179-ii096p73iqmfsibdopf58t9e5j4gvpes.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://your-backend-app.onrender.com/api/oauth/google/callback
```

### API Keys (Your existing keys):
```
OPENROUTER_API_KEY=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
ELEVENLABS_API_KEY=sk_3e605a6562fbd7f3fc36745099dca62bba03c09a4bdf2a97
RESEND_API_KEY=re_6NTVnyFK_Gb6EHTHWW1YAavqPxxSaTUR2
GOOGLE_API_KEY=AIzaSyBa8QC8T1R__z05KwEVQduHX2bInWCivbE
ONESIGNAL_APP_ID=36ea6058-6843-4080-b67d-811dc96c1783
ONESIGNAL_REST_API_KEY=os_v2_app_g3vgawdiinaibnt5qeo4s3axqpxtfwzbwwfuvhvdi4a76dzcp5mothtsfz3hhbee5yqlqaba4vdqivzz5biqbl3fyqnzx7oamamd5by
```

## Frontend Environment Variables (for Netlify)

### Required Variables:
```
VITE_BACKEND_URL=https://your-backend-app.onrender.com
VITE_APP_NAME=Boetos
VITE_APP_ENV=production
```

### Google OAuth (Update for production):
```
VITE_GOOGLE_CLIENT_ID=711853017179-ii096p73iqmfsibdopf58t9e5j4gvpes.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URIS=https://your-frontend-app.netlify.app
VITE_GOOGLE_JAVASCRIPT_ORIGINS=https://your-frontend-app.netlify.app
```

## 🔧 Setup Steps

### 1. Generate New Secrets
```bash
# Generate new session secret
openssl rand -base64 32

# Generate new JWT secret
openssl rand -base64 32
```

### 2. Update Google OAuth Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add production URLs to:
   - **Authorized JavaScript origins:**
     - `https://your-frontend-app.netlify.app`
   - **Authorized redirect URIs:**
     - `https://your-backend-app.onrender.com/api/oauth/google/callback`

### 3. Database Setup
You can use:
- **Render PostgreSQL** (free tier)
- **Railway PostgreSQL** (free tier)
- **Supabase** (free tier)
- **Neon** (free tier)

### 4. Deployment Order
1. Deploy backend first
2. Get the backend URL
3. Update frontend environment variables with backend URL
4. Deploy frontend
5. Update backend environment variables with frontend URL
6. Redeploy both

## 🚨 Security Checklist

- [ ] Generate new SESSION_SECRET
- [ ] Generate new JWT_SECRET
- [ ] Update Google OAuth redirect URIs
- [ ] Use HTTPS URLs only
- [ ] Set NODE_ENV=production
- [ ] Never commit .env files to Git 