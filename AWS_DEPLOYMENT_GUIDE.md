# AWS Deployment Guide for Paddle Partner

## Prerequisites
1. AWS Account with appropriate permissions
2. GitHub repository with your code
3. MongoDB Atlas database (recommended) or AWS DocumentDB
4. Google OAuth credentials
5. Strava API credentials

## Deployment Steps

### Step 1: Prepare Environment Variables

#### Frontend (.env.production):
```bash
cp .env.production.example .env.production
# Edit with your actual values
```

#### Backend (server/.env.production):
```bash
cp server/.env.production.example server/.env.production
# Edit with your actual values
```

### Step 2: Deploy Frontend with AWS Amplify

1. **Go to AWS Amplify Console:**
   - https://console.aws.amazon.com/amplify/

2. **Connect Repository:**
   - Click "New app" → "Host web app"
   - Choose "GitHub" and authorize
   - Select your repository: `paddlepartner`
   - Branch: `main`

3. **Configure Build Settings:**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node version: `18`

4. **Environment Variables:**
   Add these in Amplify Console → App → Environment variables:
   ```
   VITE_API_BASE_URL=https://your-backend-url.amazonaws.com/api
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_STRAVA_CLIENT_ID=your-strava-client-id
   VITE_STRAVA_REDIRECT_URI=https://your-frontend-url.amplifyapp.com/auth/strava/callback
   ```

5. **Deploy:**
   - Click "Save and deploy"
   - Wait for build to complete
   - Note your app URL: `https://xxx.amplifyapp.com`

### Step 3: Deploy Backend with AWS App Runner

1. **Create apprunner.yaml in server directory:**
   ```yaml
   version: 1.0
   runtime: nodejs18
   build:
     commands:
       build:
         - echo "No build required"
   run:
     runtime-version: 18
     command: npm start
     network:
       port: 3001
     env:
       - name: PORT
         value: "3001"
   ```

2. **Go to AWS App Runner Console:**
   - https://console.aws.amazon.com/apprunner/

3. **Create Service:**
   - Source: "Source code repository"
   - Connect to GitHub and select repository
   - Source directory: `/server`
   - Deployment trigger: "Automatic"

4. **Configure Service:**
   - Service name: `paddle-partner-api`
   - Port: `3001`

5. **Environment Variables:**
   Add all variables from `server/.env.production.example`

6. **Deploy:**
   - Create and deploy service
   - Note your service URL: `https://xxx.amazonaws.com`

### Step 4: Update Configuration

1. **Update Frontend Environment:**
   - In Amplify Console, update `VITE_API_BASE_URL` with your App Runner URL
   - Redeploy frontend

2. **Update Backend CORS:**
   - In App Runner, update `CLIENT_URL` with your Amplify URL
   - Service will auto-redeploy

### Step 5: Configure External Services

1. **Google OAuth:**
   - Add Amplify URL to authorized origins
   - Add redirect URIs

2. **Strava API:**
   - Update redirect URI to your Amplify URL

3. **MongoDB Atlas:**
   - Whitelist App Runner IP ranges (or use 0.0.0.0/0 for simplicity)

## Alternative Deployment Options

### Option 2: Container Deployment (Advanced)

1. **Create Dockerfile for frontend:**
   ```dockerfile
   FROM nginx:alpine
   COPY dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Backend already containerizable with existing structure**

3. **Deploy to ECS/Fargate or Elastic Beanstalk**

### Option 3: Serverless (Lambda + API Gateway)

1. **Use AWS SAM or Serverless Framework**
2. **Convert Express routes to Lambda functions**
3. **Frontend stays on Amplify/S3+CloudFront**

## Cost Estimation (Monthly)

- **Amplify Hosting:** ~$1-5 (depending on traffic)
- **App Runner:** ~$10-50 (depending on usage)
- **MongoDB Atlas:** $0-9 (free tier available)
- **Total:** ~$11-64/month for small to medium usage

## Next Steps

1. Choose deployment option (Amplify + App Runner recommended)
2. Set up environment variables
3. Deploy frontend first
4. Deploy backend second
5. Test end-to-end functionality
6. Set up monitoring and logging

Would you like me to help you with any specific step or create additional configuration files?