# Email Service Setup Guide - Gmail SMTP

This guide explains how to configure the email service for the BBTAP application using Gmail SMTP.

## Overview

The application uses **nodemailer** with Gmail SMTP to send:
- Organization invitation emails
- Welcome emails after joining
- Invitation reminder emails

All emails are sent from: **support@bahbeta.com**

## Prerequisites

1. A Gmail account (or Google Workspace account for support@bahbeta.com)
2. Access to the Gmail account settings
3. Backend .env file access

## Gmail SMTP Configuration Steps

### Step 1: Enable 2-Step Verification

1. Go to your Google Account settings: https://myaccount.google.com/security
2. Find "2-Step Verification" section
3. Click "Get Started" and follow the prompts to enable it
4. This is required to generate App Passwords

### Step 2: Generate an App Password

1. Go to App Passwords page: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
2. Click "Select app" dropdown and choose "Mail"
3. Click "Select device" dropdown and choose "Other (Custom name)"
4. Enter a name like "BBTAP Backend Server"
5. Click "Generate"
6. Copy the 16-character App Password (format: xxxx xxxx xxxx xxxx)
   - **Important:** You won't be able to see this password again!

### Step 3: Configure Backend Environment Variables

Edit the `backend/.env` file and update the email configuration:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=support@bahbeta.com
EMAIL_PASS=your-16-character-app-password-here
EMAIL_FROM=support@bahbeta.com
```

**Important Notes:**
- Replace `your-16-character-app-password-here` with the App Password from Step 2
- Remove spaces from the App Password (Gmail shows it as xxxx xxxx xxxx xxxx)
- Use `EMAIL_USER=support@bahbeta.com` (the actual Gmail account)
- The `EMAIL_PASS` is the App Password, NOT your regular Gmail password

### Step 4: Restart the Backend Server

After updating the .env file, restart the backend server:

```bash
cd backend
npm start
```

## Email Service Features

### 1. Invitation Email
Sent when an organization admin invites a new member.

**Trigger:** POST `/api/invitations/send`

**Contains:**
- Organization name and details
- Inviter's name
- Role assignment
- Invitation acceptance link
- Expiration date/time

### 2. Welcome Email
Sent when a user accepts an invitation and joins an organization.

**Trigger:** POST `/api/invitations/:token/accept`

**Contains:**
- Welcome message
- Organization name
- Quick start guide
- Dashboard link

### 3. Reminder Email
Sent when an admin resends an invitation.

**Trigger:** POST `/api/invitations/:token/resend`

**Contains:**
- Reminder message
- Expiration warning
- Invitation link

## Testing the Email Service

### Method 1: Through the Frontend UI

1. Log in as an organization admin
2. Navigate to Team Management
3. Click "Invite Member"
4. Fill in email, name, and role
5. Click "Send Invitation"
6. Check the recipient's inbox for the invitation email

### Method 2: Using curl/Postman

```bash
# Get your auth token first by logging in
TOKEN="your-jwt-token"

# Send invitation
curl -X POST http://localhost:5000/api/invitations/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "role": "member",
    "expiresInDays": 7
  }'
```

### Method 3: Check Backend Logs

When an email is sent, you'll see console logs:

```
Invitation email sent: <message-id>
```

If email credentials are missing, you'll see:
```
⚠️ Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file.
```

## Troubleshooting

### Issue: "Invalid login: 535 Authentication failed"

**Cause:** Using regular Gmail password instead of App Password

**Solution:**
- Generate an App Password (see Step 2 above)
- Update EMAIL_PASS in .env with the App Password

### Issue: "Less secure app access"

**Cause:** Google blocked login attempt

**Solution:**
- Use App Passwords instead (recommended)
- OR enable "Less secure app access" (not recommended for production)

### Issue: Emails not sending, no error

**Cause:** Environment variables not loaded

**Solution:**
- Verify .env file is in the backend directory
- Check that nodemon or your server restart picks up .env changes
- Restart the backend server completely

### Issue: "ETIMEDOUT" or "ECONNREFUSED"

**Cause:** Network/firewall blocking SMTP port 587

**Solution:**
- Check firewall settings
- Verify port 587 is not blocked
- Try port 465 with `secure: true` if 587 doesn't work

### Issue: "Invalid address" or email format errors

**Cause:** Email addresses not properly formatted

**Solution:**
- Ensure EMAIL_USER contains the full email address
- Verify EMAIL_FROM is a valid email format

## Gmail SMTP Limitations

- **Daily sending limit:** 500 emails per day for free Gmail accounts
- **Rate limit:** ~100 emails per minute
- **Google Workspace:** Higher limits (2,000/day for paid accounts)

For production with high volume, consider:
- SendGrid (transactional email service)
- AWS SES (Amazon Simple Email Service)
- Mailgun
- Postmark

## Security Best Practices

1. **Never commit .env file to git**
   - Already in .gitignore
   - Use environment variables in production (Vercel, Heroku, etc.)

2. **Use App Passwords instead of account passwords**
   - Provides better security
   - Can be revoked without changing main password

3. **Rotate App Passwords periodically**
   - Generate new App Password
   - Update .env
   - Revoke old App Password in Google Account settings

4. **Monitor failed login attempts**
   - Check Google Account security notifications
   - Investigate any suspicious activity

## Production Deployment

For Vercel or other hosting platforms:

1. Go to your project settings
2. Add environment variables:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=support@bahbeta.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=support@bahbeta.com
   ```

3. Redeploy your application

**Note:** Ensure FRONTEND_URL is also set correctly for invitation links to work.

## Email Templates

Email templates are defined in `backend/services/emailService.js` with:
- Responsive HTML design
- BBTap branding
- Mobile-friendly layout
- Professional styling

To customize templates:
1. Edit the `emailHtml` sections in emailService.js
2. Test with different email clients (Gmail, Outlook, Apple Mail)
3. Validate HTML with email-friendly CSS (inline styles)

## Support

If you encounter issues:

1. Check backend console logs for error messages
2. Verify .env configuration
3. Test with a simple email send first
4. Check Google Account activity for blocked login attempts

For Google/Gmail specific issues:
- Google Account Help: https://support.google.com/accounts
- App Passwords Guide: https://support.google.com/accounts/answer/185833

---

**Last Updated:** December 1, 2025
**Configuration:** Gmail SMTP with support@bahbeta.com
**Service:** nodemailer v6.x
