# Vercel 404 Fix for Public Profile Routes

## Issue
The URL `https://bbetanfc.vercel.app/p/chandini-kapoor` returns a 404 error.

## Root Cause
The React Single Page Application (SPA) needs all non-API routes to be served with `index.html` so that React Router can handle client-side routing.

## Solution Applied

### Updated `vercel.json`
Changed from using `routes` to `rewrites` configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/build"
      }
    },
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This configuration:
1. Routes all `/api/*` requests to the Node.js API
2. Routes all other requests to `index.html`, allowing React Router to handle client-side routing

## How It Works
1. User visits `/p/chandini-kapoor`
2. Vercel serves the React app's `index.html`
3. React Router takes over and renders the `PublicProfilePage` component
4. The component fetches data from `/api/public/chandini-kapoor`
5. The profile is displayed

## Deployment Steps
1. Commit these changes
2. Push to your repository
3. Vercel will automatically rebuild and deploy
4. The `/p/*` routes should now work correctly

## Alternative Solution (if rewrites don't work)
If the above doesn't work, you can try this vercel.json instead:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/build/index.html"
    }
  ]
}
```