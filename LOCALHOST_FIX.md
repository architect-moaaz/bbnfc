# Fix for Localhost References in Public Profile

## Issue
The "Save Contact" functionality on public profiles was pointing to localhost URLs instead of the production API.

## Root Cause
The `PublicProfilePage.tsx` had hardcoded localhost URLs for:
1. Analytics tracking
2. vCard download

## Changes Made

### 1. Updated Analytics Tracking
Changed from direct fetch with hardcoded URL:
```typescript
// Before
const response = await fetch(`http://localhost:5000/p/${profileId}/analytics`, {
  method: 'POST',
  // ...
});

// After
await publicAPI.recordAnalytics(profileId, {
  eventType,
  eventData,
  visitor: {
    sessionId: sessionStorage.getItem('sessionId') || 'anonymous',
    userAgent: navigator.userAgent,
    language: navigator.language,
  }
});
```

### 2. Updated vCard Download
Changed from hardcoded URL to using the API service:
```typescript
// Before
const vCardUrl = `http://localhost:5000/p/${profileId}/vcard`;
const link = document.createElement('a');
link.href = vCardUrl;
link.download = `${profile.personalInfo.firstName}_${profile.personalInfo.lastName}.vcf`;
link.click();

// After
const blob = await publicAPI.downloadVCard(profileId);
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `${profile.personalInfo.firstName}_${profile.personalInfo.lastName}.vcf`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
window.URL.revokeObjectURL(url);
```

## Benefits
1. **Environment-aware**: Uses `REACT_APP_API_URL` environment variable
2. **Consistent API usage**: All API calls go through the centralized API service
3. **Production-ready**: Works correctly in both development and production
4. **Better error handling**: Leverages the API service's error handling

## How It Works Now
1. User clicks "Save Contact" on a public profile
2. The app calls `publicAPI.downloadVCard(profileId)`
3. The API service uses the correct base URL (from environment or default)
4. The vCard is downloaded as a blob
5. A temporary download link is created and clicked
6. The contact is saved to the user's device

## Environment Variable
Make sure `REACT_APP_API_URL` is set in production to point to your API:
```
REACT_APP_API_URL=https://bbetanfc.vercel.app/api
```