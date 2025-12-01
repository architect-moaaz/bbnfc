# Email Configuration Guide

This guide explains how to configure email sending for user registration, password reset, and email verification features.

## Gmail SMTP Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password
1. In Google Account Security settings, find "2-Step Verification"
2. Scroll down to "App passwords"
3. Click "App passwords" 
4. Select "Mail" as the app and "Other" as the device
5. Enter "NFC Business Card App" as the name
6. Copy the generated 16-character app password (format: xxxx xxxx xxxx xxxx)

### Step 3: Environment Variables
Add these to your `.env` file:

```bash
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
EMAIL_FROM=NFC Business Card <your-email@gmail.com>

# Set to false to actually send emails, true to mock in development
EMAIL_MOCK=false
```

## Alternative Email Providers

### Outlook/Hotmail SMTP
```bash
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@hotmail.com
EMAIL_PASS=your-password
EMAIL_FROM=NFC Business Card <your-email@hotmail.com>
```

### Custom SMTP Provider
```bash
EMAIL_SERVICE=custom
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
EMAIL_FROM=NFC Business Card <your-email@domain.com>
```

## Development vs Production

### Development Mode (Email Mocking)
When `EMAIL_MOCK=true` and `NODE_ENV=development`, emails are logged to console instead of sent:

```bash
EMAIL_MOCK=true
NODE_ENV=development
```

Output:
```
📧 Email would be sent to: user@example.com
📧 Subject: Welcome to NFC Business Cards!
📧 Message: Thank you for registering...
```

### Production Mode (Actual Email Sending)
Set `EMAIL_MOCK=false` or remove it entirely:

```bash
EMAIL_MOCK=false
# or simply don't include EMAIL_MOCK
```

## Testing Email Configuration

### Test Registration Email
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' \
  http://localhost:5000/api/auth/register
```

### Test Password Reset Email
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  http://localhost:5000/api/auth/forgotpassword
```

## Email Features

The application sends emails for:

1. **User Registration** - Email verification link
2. **Password Reset** - Password reset link with token
3. **Account Updates** - Notifications (if implemented)

## Troubleshooting

### Common Errors

**EAUTH Error (Invalid credentials)**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
- Ensure 2FA is enabled on Gmail
- Use App Password, not regular password
- Double-check EMAIL_USER and EMAIL_APP_PASSWORD

**ECONNREFUSED Error**
```
Error: connect ECONNREFUSED 127.0.0.1:587
```
- Check EMAIL_SERVICE is set correctly
- Verify internet connection
- Ensure firewall isn't blocking port 587

**TLS/SSL Errors**
```
Error: self signed certificate in certificate chain
```
- The configuration includes `tls: { rejectUnauthorized: false }` to handle this

### Debug Mode
To see detailed email configuration:
```bash
DEBUG=* node your-app.js
```

## Security Notes

- Never commit real email credentials to version control
- Use App Passwords for Gmail, not regular passwords
- Keep EMAIL_APP_PASSWORD secure and rotate regularly
- Consider using environment-specific email addresses for testing

## Vercel Deployment

For Vercel deployment, add environment variables in your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables" 
3. Add all EMAIL_* variables with their values
4. Redeploy your application