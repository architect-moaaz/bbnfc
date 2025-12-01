const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Use Gmail SMTP for both development and production
  // Configure with environment variables from .env

  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // false for 587, true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Do not fail on invalid certs (for development)
      rejectUnauthorized: false
    }
  };

  // Validate configuration
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️ Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file.');
    console.warn('Email sending will fail until configured.');
  }

  return nodemailer.createTransporter(emailConfig);
};

/**
 * Send organization invitation email
 */
const sendInvitationEmail = async ({
  recipientEmail,
  recipientName,
  organizationName,
  inviterName,
  inviteUrl,
  role,
  expiresAt
}) => {
  try {
    const transporter = createTransporter();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Join ${organizationName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);
            padding: 40px 30px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #64748B;
          }
          .details-box {
            background-color: #F8FAFC;
            border-left: 4px solid #2563EB;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
          }
          .details-box p {
            margin: 10px 0;
            font-size: 14px;
          }
          .details-box strong {
            color: #1E293B;
          }
          .cta-button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #2563EB;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
          }
          .cta-button:hover {
            background-color: #1E40AF;
          }
          .cta-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            padding: 30px;
            text-align: center;
            font-size: 14px;
            color: #64748B;
            background-color: #F8FAFC;
            border-top: 1px solid #E2E8F0;
          }
          .footer a {
            color: #2563EB;
            text-decoration: none;
          }
          .expiry-notice {
            font-size: 14px;
            color: #DC2626;
            margin-top: 20px;
            padding: 12px;
            background-color: #FEF2F2;
            border-radius: 4px;
            border-left: 4px solid #DC2626;
          }
          .alt-link {
            font-size: 12px;
            color: #64748B;
            margin-top: 20px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📨 You're Invited!</h1>
          </div>

          <div class="content">
            <p class="greeting">Hello ${recipientName || recipientEmail},</p>

            <p class="message">
              <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on BBTap.
            </p>

            <div class="details-box">
              <p><strong>Organization:</strong> ${organizationName}</p>
              <p><strong>Your Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
              <p><strong>Invited by:</strong> ${inviterName}</p>
            </div>

            <p class="message">
              As a ${role}, you'll be able to create and manage digital business cards,
              collaborate with your team, and access organization resources.
            </p>

            <div class="cta-container">
              <a href="${inviteUrl}" class="cta-button">Accept Invitation</a>
            </div>

            <div class="expiry-notice">
              ⏰ This invitation expires on ${new Date(expiresAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            <p class="alt-link">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${inviteUrl}">${inviteUrl}</a>
            </p>
          </div>

          <div class="footer">
            <p>
              This invitation was sent to ${recipientEmail}. If you didn't expect this invitation,
              you can safely ignore this email.
            </p>
            <p style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}">BBTap</a> - Digital Business Cards
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Hello ${recipientName || recipientEmail},

${inviterName} has invited you to join ${organizationName} on BBTap.

Organization: ${organizationName}
Your Role: ${role.charAt(0).toUpperCase() + role.slice(1)}
Invited by: ${inviterName}

Accept your invitation by clicking this link:
${inviteUrl}

This invitation expires on ${new Date(expiresAt).toLocaleDateString()}.

If you didn't expect this invitation, you can safely ignore this email.

---
BBTap - Digital Business Cards
${process.env.FRONTEND_URL}
    `;

    const mailOptions = {
      from: `"BBTap Support" <${process.env.EMAIL_FROM || 'support@bahbeta.com'}>`,
      to: recipientEmail,
      replyTo: 'support@bahbeta.com',
      subject: `Invitation to join ${organizationName} on BBTap`,
      text: emailText,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Invitation email sent:', info.messageId);

    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
};

/**
 * Send welcome email after joining organization
 */
const sendWelcomeEmail = async ({
  recipientEmail,
  recipientName,
  organizationName,
  dashboardUrl
}) => {
  try {
    const transporter = createTransporter();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${organizationName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            padding: 40px 30px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .cta-button {
            display: inline-block;
            padding: 16px 32px;
            background-color: #10B981;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
          }
          .cta-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            padding: 30px;
            text-align: center;
            font-size: 14px;
            color: #64748B;
            background-color: #F8FAFC;
            border-top: 1px solid #E2E8F0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${organizationName}!</h1>
          </div>

          <div class="content">
            <p>Hello ${recipientName},</p>

            <p>
              You've successfully joined <strong>${organizationName}</strong> on BBTap!
              We're excited to have you on board.
            </p>

            <p>Here's what you can do next:</p>
            <ul>
              <li>Create your digital business card profile</li>
              <li>Customize your card design</li>
              <li>Share your card with clients and contacts</li>
              <li>Track engagement analytics</li>
              <li>Collaborate with your team</li>
            </ul>

            <div class="cta-container">
              <a href="${dashboardUrl}" class="cta-button">Go to Dashboard</a>
            </div>
          </div>

          <div class="footer">
            <p><a href="${process.env.FRONTEND_URL}">BBTap</a> - Digital Business Cards</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"BBTap Support" <${process.env.EMAIL_FROM || 'support@bahbeta.com'}>`,
      to: recipientEmail,
      replyTo: 'support@bahbeta.com',
      subject: `Welcome to ${organizationName}!`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

/**
 * Send invitation reminder email
 */
const sendInvitationReminderEmail = async ({
  recipientEmail,
  recipientName,
  organizationName,
  inviteUrl,
  expiresAt
}) => {
  try {
    const transporter = createTransporter();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reminder: Invitation to ${organizationName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .cta-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #F59E0B;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <h2>⏰ Reminder: Your invitation is expiring soon</h2>
        <p>Hello ${recipientName || recipientEmail},</p>
        <p>
          This is a friendly reminder that your invitation to join
          <strong>${organizationName}</strong> will expire soon.
        </p>
        <p>
          <strong>Expires:</strong> ${new Date(expiresAt).toLocaleDateString()}
        </p>
        <p>
          <a href="${inviteUrl}" class="cta-button">Accept Invitation Now</a>
        </p>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"BBTap Support" <${process.env.EMAIL_FROM || 'support@bahbeta.com'}>`,
      to: recipientEmail,
      replyTo: 'support@bahbeta.com',
      subject: `Reminder: Invitation to ${organizationName} expiring soon`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reminder email sent:', info.messageId);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
};

module.exports = {
  sendInvitationEmail,
  sendWelcomeEmail,
  sendInvitationReminderEmail
};
