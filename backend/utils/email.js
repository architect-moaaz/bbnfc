const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // In development, just mock the email service
    console.log('📧 Using mock email service in development mode');
    return null;
  }
  
  // Production email configuration
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use app password for Gmail
      }
    });
  }
  
  // Custom SMTP configuration
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmail = async (options) => {
  try {
    // In development, just log the email instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent to:', options.email);
      console.log('📧 Subject:', options.subject);
      console.log('📧 Message:', options.message);
      
      return {
        messageId: 'dev-mock-id',
        preview: 'Email logged to console in development mode'
      };
    }
    
    // Create transporter for production
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
    
    // In development, don't throw errors for email failures
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email error ignored in development mode');
      return { messageId: 'dev-error-ignored' };
    }
    
    throw error;
  }
};

module.exports = { sendEmail };