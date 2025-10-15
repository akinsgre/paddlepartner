# Paddle Partner

A modern Vue.js 3 application for tracking paddle sports activities, built with Vite and TypeScript. Connect with Google Auth and Strava to monitor your kayaking, canoeing, and paddling adventures.

## Features

- Vue 3 with Composition API
- TypeScript for type safety
- Vite for fast development and building
- Modern ES6+ JavaScript features
- Hot module replacement in development
- **Google OAuth Authentication** for secure user login
- **Protected Routes** with Vue Router
- **Strava API Integration** for kayak activity tracking
- **Responsive Design** for all devices

## Application Structure

### Pages
- **Home Page** (`/`) - Main landing page with authentication
- **Activities Page** (`/activities`) - Protected page showing Strava kayak activities

### Authentication
- Google OAuth integration for secure login
- Persistent user sessions
- Protected route navigation

### Strava Integration
- Connect to Strava API to fetch user activities
- Filter and display kayaking/paddling activities
- Activity statistics and tracking

## Google Authentication Setup

To enable Google Auth login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Identity API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Set application type to "Web application"
6. Add authorized JavaScript origins: `http://localhost:5173`
7. Copy your client ID
8. Create a `.env.local` file in the project root:
   ```
   VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   ```
9. Restart the development server

**Note:** The app will work without Google Auth, but the login feature requires a valid client ID.

## Strava Integration Setup

To enable Strava activity tracking:

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application with these settings:
   - **Application Name**: Your app name
   - **Category**: Choose appropriate category
   - **Website**: `http://localhost:5173` (or your domain)
   - **Authorization Callback Domain**: `localhost`
3. Copy your **Client ID** and **Client Secret**
4. Add them to your `.env.local` file:
   ```
   VITE_STRAVA_CLIENT_ID=your-strava-client-id
   VITE_STRAVA_CLIENT_SECRET=your-strava-client-secret
   ```
5. Restart the development server

**Security Note:** In production, the client secret should be handled by your backend server, not exposed in the frontend. This current implementation is for development/demo purposes only.

**Important:** Never commit your `.env.local` file to version control as it contains sensitive API credentials.

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation
Dependencies are already installed. To reinstall if needed:
```bash
npm install
```

### Development
Start the development server:
```bash
npm run dev
```
The app will be available at http://localhost:5173

### Building
Build for production:
```bash
npm run build
```

### Preview Production Build
Preview the production build locally:
```bash
npm run preview
```

## Project Structure

- `src/` - Source code
  - `App.vue` - Main application component
  - `main.ts` - Application entry point
  - `components/` - Reusable Vue components
  - `assets/` - Static assets
- `public/` - Public static files
- `vite.config.ts` - Vite configuration

## Development Guidelines

- Use Composition API for new components
- Follow Vue 3 best practices
- Use TypeScript for type safety
- Maintain component modularity

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
