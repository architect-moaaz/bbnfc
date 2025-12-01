# Public Profile URL Fix

## Issue
The URL `https://bbetanfc.vercel.app/p/chandini-kapoor` was returning JSON data instead of rendering the profile page.

## Root Cause
The `vercel.json` was routing `/p/*` requests to the API backend (`/api/index.js`), which returns JSON data. Instead, these routes should be handled by the React frontend.

## Changes Made

### 1. Updated `vercel.json`
- Removed the route that directed `/p/*` to the API
- Now `/p/*` routes are handled by the React frontend

### 2. Updated API routes in `api/index.js`
- Changed `/p` routes to `/api/public`
- Public profile data is now accessed via:
  - GET `/api/public/:profileId` - Get profile data
  - POST `/api/public/:profileId/analytics` - Track analytics
  - GET `/api/public/:profileId/vcard` - Download vCard

### 3. Updated Frontend API service (`frontend/src/services/api.ts`)
- Updated `publicAxios` to use the same API base URL
- Changed all public API calls to use `/api/public/*` endpoints:
  - `getPublicProfile`: `/p/${profileId}` → `/public/${profileId}`
  - `recordAnalytics`: Updated signature and endpoint
  - `downloadVCard`: `/p/${profileId}/vcard` → `/public/${profileId}/vcard`

## Result
- The URL `/p/chandini-kapoor` will now be handled by the React router
- The React app will render the `PublicProfilePage` component
- The page will fetch profile data from `/api/public/chandini-kapoor`
- Users will see the styled profile page instead of raw JSON

## Deployment
After deploying these changes to Vercel:
1. The routing will be handled correctly
2. Public profiles will display as intended
3. API endpoints remain available at `/api/public/*` for data access