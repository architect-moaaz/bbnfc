const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Check if we should mock emails in development
  if (process.env.NODE_ENV === 'development' && process.env.EMAIL_MOCK === 'true') {
    console.log('📧 Using mock email service in development mode');
    return null;
  }
  
  // Gmail SMTP configuration
  if (process.env.EMAIL_SERVICE === 'gmail') {
    console.log('📧 Configuring Gmail SMTP...');
    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use app password for Gmail
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  // Outlook/Hotmail SMTP configuration
  if (process.env.EMAIL_SERVICE === 'outlook') {
    console.log('📧 Configuring Outlook SMTP...');
    return nodemailer.createTransport({
      service: 'hotmail',
      host: 'smtp.live.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  // Custom SMTP configuration
  if (process.env.EMAIL_HOST) {
    console.log('📧 Configuring custom SMTP...', process.env.EMAIL_HOST);
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  // Fallback error
  throw new Error('No email service configured. Please set EMAIL_SERVICE environment variable.');
};

const sendEmail = async (options) => {
  try {
    // In development, optionally just log the email instead of sending
    if (process.env.NODE_ENV === 'development' && process.env.EMAIL_MOCK === 'true') {
      console.log('📧 Email would be sent to:', options.email);
      console.log('📧 Subject:', options.subject);
      console.log('📧 Message:', options.message);
      
      return {
        messageId: 'dev-mock-id',
        preview: 'Email logged to console in development mode'
      };
    }
    
    // Create transporter
    const transporter = createTransporter();
    
    if (!transporter) {
      throw new Error('Email transporter not configured');
    }
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || `NFC Business Card <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || options.message
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    
    return info;
    
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      address: error.address,
      port: error.port
    });
    
    // In development, optionally don't throw errors for email failures
    if (process.env.NODE_ENV === 'development' && process.env.EMAIL_MOCK === 'true') {
      console.log('📧 Email error ignored in development mock mode');
      return { messageId: 'dev-error-ignored' };
    }
    
    throw error;
  }
};

module.exports = { sendEmail };