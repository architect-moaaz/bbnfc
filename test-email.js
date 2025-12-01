// Test Gmail SMTP configuration
const { sendEmail } = require('./backend/utils/email');

async function testGmailSetup() {
  console.log('🧪 Testing Gmail SMTP configuration...');
  console.log('Environment variables:');
  console.log('- EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
  console.log('- EMAIL_USER:', process.env.EMAIL_USER);
  console.log('- EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '✓ Set' : '❌ Not set');
  console.log('- EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('- EMAIL_MOCK:', process.env.EMAIL_MOCK);
  
  try {
    const result = await sendEmail({
      email: 'test@example.com', // Change this to your test email
      subject: 'Test Email from NFC Business Card Platform',
      message: 'This is a test email to verify Gmail SMTP configuration is working correctly.'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.log('❌ Email sending failed:');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔍 Troubleshooting EAUTH error:');
      console.log('1. Make sure 2-Factor Authentication is enabled on Gmail');
      console.log('2. Use App Password, not regular Gmail password');
      console.log('3. Check EMAIL_USER is your full Gmail address');
      console.log('4. Check EMAIL_APP_PASSWORD is the 16-character app password');
    }
  }
}

// Run the test
testGmailSetup();