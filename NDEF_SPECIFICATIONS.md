# NDEF Specifications for BBTap NFC Business Cards

## Overview

This document outlines the NDEF (NFC Data Exchange Format) specifications for BBTap NFC business cards, including URL structures, deep linking configuration, and programming instructions.

## Table of Contents

1. [NDEF Record Structure](#ndef-record-structure)
2. [URL Patterns](#url-patterns)
3. [Deep Linking Setup](#deep-linking-setup)
4. [Card Programming](#card-programming)
5. [Platform-Specific Behavior](#platform-specific-behavior)
6. [Testing & Validation](#testing--validation)

---

## NDEF Record Structure

### Basic NDEF Message Format

BBTap cards use a single NDEF record with a URI (Well Known Type).

```
NDEF Message:
  - Record 1: URI Record (Well Known Type)
    - TNF: 0x01 (Well Known)
    - Type: "U" (URI)
    - Payload: URL with prefix
```

### NDEF Payload Structure

```
Byte 0: URI Identifier Code
  - 0x00: No prepending
  - 0x01: http://www.
  - 0x02: https://www.
  - 0x03: http://
  - 0x04: https://

Bytes 1-N: URL data (ASCII encoded)
```

**Example for `https://bbtap.me/john-doe`:**
```
0x04 62 62 74 61 70 2E 6D 65 2F 6A 6F 68 6E 2D 64 6F 65
```
- `0x04` = https://
- Remaining bytes = "bbtap.me/john-doe" in ASCII

---

## URL Patterns

### 1. Individual User Profiles

**Format:** `https://bbtap.me/:username`

**Examples:**
- `https://bbtap.me/john-doe`
- `https://bbtap.me/jane-smith`

**Use Case:** Personal business cards, freelancers, individuals

### 2. Organization Member Profiles

**Format:** `https://:subdomain.bbtap.me/:username`

**Examples:**
- `https://acme.bbtap.me/john-doe`
- `https://techcorp.bbtap.me/jane-smith`

**Use Case:** Corporate employees, organization members

### 3. Custom Domain Profiles

**Format:** `https://:custom-domain/:username`

**Examples:**
- `https://cards.acmecorp.com/john-doe`
- `https://team.techstartup.io/sarah-wilson`

**Use Case:** Large enterprises with custom branding

### 4. Card Claim URLs

**Format:** `https://bbtap.me/claim/:token`

**Examples:**
- `https://bbtap.me/claim/abc123xyz789`

**Use Case:** New card activation, card claiming flow

### 5. Short Card IDs (Optional)

**Format:** `https://bbtap.me/c/:cardId`

**Examples:**
- `https://bbtap.me/c/BB-ABCD1234`

**Use Case:** Card management, tracking, redirect to profile

---

## Deep Linking Setup

### iOS Universal Links

**File:** `/.well-known/apple-app-site-association`

**Content:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.bbtap.app",
        "paths": [
          "/*",
          "/*/",
          "/claim/*",
          "/c/*"
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAM_ID.com.bbtap.app"]
  },
  "appclips": {
    "apps": ["TEAM_ID.com.bbtap.app.Clip"]
  }
}
```

**Requirements:**
1. HTTPS only
2. File served at root domain: `https://bbtap.me/.well-known/apple-app-site-association`
3. No file extension
4. Content-Type: `application/json`
5. Must be accessible without redirects

**iOS Implementation:**
```swift
// AppDelegate.swift or SceneDelegate.swift
func application(_ application: UIApplication,
                 continue userActivity: NSUserActivity,
                 restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
          let url = userActivity.webpageURL else {
        return false
    }

    // Parse URL and handle routing
    handleUniversalLink(url)
    return true
}
```

### Android App Links

**File:** `/.well-known/assetlinks.json`

**Content:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.bbtap.app",
      "sha256_cert_fingerprints": [
        "YOUR_APP_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

**Android Manifest Configuration:**
```xml
<activity android:name=".MainActivity">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />

        <!-- Main domain -->
        <data android:scheme="https" android:host="bbtap.me" />

        <!-- Subdomain pattern -->
        <data android:scheme="https" android:host="*.bbtap.me" />

        <!-- Path patterns -->
        <data android:pathPrefix="/" />
        <data android:pathPrefix="/claim/" />
        <data android:pathPrefix="/c/" />
    </intent-filter>
</activity>
```

**Get SHA-256 Fingerprint:**
```bash
# For debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore
keytool -list -v -keystore /path/to/release.keystore -alias your-alias
```

---

## Card Programming

### Hardware Requirements

**Recommended NFC Chip Types:**
1. **NTAG213** (144 bytes)
   - URL capacity: ~130 bytes
   - Best for: Standard profiles

2. **NTAG215** (504 bytes)
   - URL capacity: ~490 bytes
   - Best for: Complex URLs with UTM parameters

3. **NTAG216** (888 bytes)
   - URL capacity: ~870 bytes
   - Best for: Long URLs, extensive tracking

### Programming Tools

**Mobile Apps:**
1. **NFC Tools (iOS/Android)** - Free
   - Simple URL writing
   - NDEF record creation

2. **TagWriter by NXP (iOS/Android)** - Free
   - Advanced NDEF editing
   - Multiple record support

**Desktop Software:**
1. **NFC TagWriter by Sony** - Free (Windows)
2. **GoToTags Desktop App** - Free trial

### Programming Steps

#### Using NFC Tools App

1. **Open NFC Tools app**
2. **Go to "Write" tab**
3. **Select "Add a record"**
4. **Choose "URL/URI"**
5. **Enter the full URL:**
   ```
   https://bbtap.me/username
   ```
   or
   ```
   https://acme.bbtap.me/username
   ```
   or
   ```
   https://bbtap.me/claim/TOKEN_HERE
   ```
6. **Tap "Write"**
7. **Hold NFC card to phone**
8. **Wait for confirmation**

#### Using TagWriter by NXP

1. **Open TagWriter app**
2. **Select "Write tags"**
3. **Choose "New dataset"**
4. **Select "Link" record**
5. **Enter URL**
6. **Save dataset**
7. **Write to tag**

### URL Best Practices

**DO:**
- ✅ Use HTTPS (required for universal links)
- ✅ Keep URLs short (under 100 characters if possible)
- ✅ Use lowercase for usernames
- ✅ Test on both iOS and Android
- ✅ Lock tags after writing (for production)

**DON'T:**
- ❌ Use HTTP (won't work with app links)
- ❌ Use special characters in usernames
- ❌ Write multiple URL records
- ❌ Use URL shorteners (defeats deep linking)

---

## Platform-Specific Behavior

### iOS (iPhone 7 and later)

**NFC Reading:**
- Background tag reading (iOS 14+)
- Requires Core NFC capability
- Automatically opens Safari or app

**Behavior:**
1. User taps NFC card on iPhone
2. Notification appears at top of screen
3. User taps notification
4. If app installed → Opens in app
5. If app not installed → Opens in Safari

**Deep Link Priority:**
```
1. Native app (if installed and verified)
2. Safari web view
3. System browser
```

### Android (NFC-enabled devices)

**NFC Reading:**
- Always-on NFC reading (when unlocked)
- Works on lock screen (Android 10+)
- Faster than iOS

**Behavior:**
1. User taps NFC card on Android phone
2. System reads NDEF message
3. If app installed → Opens directly in app
4. If app not installed → Opens in Chrome

**Deep Link Priority:**
```
1. Native app with verified domain
2. Disambiguation dialog (if multiple apps)
3. Chrome browser
```

---

## Testing & Validation

### Pre-Production Testing

**1. URL Validation**
```bash
# Test URL accessibility
curl -I https://bbtap.me/test-username

# Verify deep link files
curl https://bbtap.me/.well-known/apple-app-site-association
curl https://bbtap.me/.well-known/assetlinks.json
```

**2. NDEF Validation**
- Use NFC Tools app "Read" mode
- Verify single URI record
- Check URL encoding
- Confirm payload size

**3. iOS Testing**
```bash
# Validate AASA file
https://search.developer.apple.com/appsearch-validation-tool/

# Test steps:
1. Install app via TestFlight
2. Tap NFC card
3. Verify app opens (not Safari)
4. Check correct screen loads
```

**4. Android Testing**
```bash
# Test App Link
adb shell am start -a android.intent.action.VIEW -d "https://bbtap.me/test-username"

# Verify domain association
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://bbtap.me&relation=delegate_permission/common.handle_all_urls
```

### Production Testing Checklist

- [ ] URLs resolve correctly
- [ ] HTTPS certificate valid
- [ ] Deep link files accessible
- [ ] iOS app opens on tap (if installed)
- [ ] Android app opens on tap (if installed)
- [ ] Fallback to web works correctly
- [ ] Analytics tracking works
- [ ] UTM parameters preserved (if used)
- [ ] Lock NFC tags after verification

---

## URL Encoding Examples

### Standard Profile URL
```
Input: https://bbtap.me/john-doe
NDEF: 04 62 62 74 61 70 2E 6D 65 2F 6A 6F 68 6E 2D 64 6F 65
Size: 17 bytes
```

### Organization Profile URL
```
Input: https://acme.bbtap.me/john-doe
NDEF: 04 61 63 6D 65 2E 62 62 74 61 70 2E 6D 65 2F 6A 6F 68 6E 2D 64 6F 65
Size: 24 bytes
```

### Claim URL
```
Input: https://bbtap.me/claim/abc123xyz789
NDEF: 04 62 62 74 61 70 2E 6D 65 2F 63 6C 61 69 6D 2F 61 62 63 31 32 33 78 79 7A 37 38 39
Size: 28 bytes
```

### With UTM Parameters
```
Input: https://bbtap.me/john-doe?utm_source=nfc&utm_medium=card&utm_campaign=launch
NDEF: 04 62 62 74 61 70 2E 6D 65 2F 6A 6F 68 6E 2D 64 6F 65 3F 75 74 6D 5F 73 6F 75 72 63 65 3D 6E 66 63 26 75 74 6D 5F 6D 65 64 69 75 6D 3D 63 61 72 64 26 75 74 6D 5F 63 61 6D 70 61 69 67 6E 3D 6C 61 75 6E 63 68
Size: 66 bytes
```

---

## Security Considerations

### Tag Locking

**Why Lock Tags:**
- Prevents URL modification
- Protects against malicious redirects
- Ensures brand integrity

**How to Lock:**
1. Write NDEF message
2. Verify URL works correctly
3. Use NFC Tools "Lock tag" feature
4. **WARNING:** This is permanent!

**Lock Only When:**
- URL is finalized
- Testing is complete
- Ready for distribution

### URL Security

**Best Practices:**
- Always use HTTPS
- Validate SSL certificates
- Avoid exposing sensitive data in URLs
- Use claim tokens (not user IDs) in claim URLs
- Implement rate limiting on backend
- Monitor for unusual traffic patterns

---

## Troubleshooting

### iOS Not Opening App

**Check:**
1. AASA file accessible and valid
2. App entitlements configured correctly
3. Team ID matches in AASA
4. Paths configured in app
5. App installed via TestFlight or App Store (not Xcode)

**Fix:**
```bash
# Re-validate AASA
curl https://bbtap.me/.well-known/apple-app-site-association | python -m json.tool

# Clear iOS universal link cache (requires device reset)
Settings > General > Transfer or Reset iPhone > Reset > Reset Location & Privacy
```

### Android Not Opening App

**Check:**
1. assetlinks.json accessible
2. SHA-256 fingerprint correct
3. Package name matches
4. autoVerify="true" in manifest
5. HTTPS (not HTTP)

**Fix:**
```bash
# Verify domain association
adb shell pm get-app-links com.bbtap.app

# Reset app link settings
adb shell pm set-app-links --package com.bbtap.app 0
```

### NFC Not Reading

**Check:**
1. NFC enabled on phone
2. Card positioned correctly
3. Phone case not blocking signal
4. Tag not damaged
5. NDEF message properly formatted

---

## References

- [NFC Forum NDEF Specification](https://nfc-forum.org/our-work/specification-releases/specifications/nfc-forum-assigned-numbers-register/)
- [iOS Universal Links Documentation](https://developer.apple.com/ios/universal-links/)
- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [NTAG Chip Specifications](https://www.nxp.com/products/rfid-nfc/nfc-hf/ntag)

---

## Support

For technical support or questions about NFC card programming:
- Email: support@bbtap.me
- Documentation: https://docs.bbtap.me
- GitHub Issues: https://github.com/bbtap/platform/issues
