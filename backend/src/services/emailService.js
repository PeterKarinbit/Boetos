const { Resend } = require('resend');

console.log('EmailService: RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('EmailService: RESEND_API_KEY length:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0);

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  static async sendVerificationEmail(email, name, token) {
    try {
      console.log('EmailService: Attempting to send verification email to:', email);
      console.log('EmailService: Using token:', token);
      
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      console.log('EmailService: Verification URL:', verificationUrl);
      
      const { data, error } = await resend.emails.send({
        from: 'Boetos <onboarding@resend.dev>',
        to: [email],
        subject: 'Confirm your Boetos account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">Boetos</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">AI Assistant for Entrepreneurs</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Welcome to Boetos!</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                Hi ${name},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                Thank you for signing up for Boetos! To complete your registration and unlock all features, 
                please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; 
                          border-radius: 8px; font-weight: 600; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              
              <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">
                ${verificationUrl}
              </p>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px;">
              <p>This link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create a Boetos account, you can safely ignore this email.</p>
            </div>
          </div>
        `
      });

      if (error) {
        console.error('EmailService: Resend API error:', error);
        throw new Error('Failed to send verification email');
      }

      console.log('EmailService: Email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('EmailService: Email service error:', error);
      throw error;
    }
  }

  static async sendWelcomeEmail(email, name) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Boetos <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to Boetos! Your account is now verified',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">Boetos</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">AI Assistant for Entrepreneurs</p>
            </div>
            
            <div style="background: #f0fdf4; padding: 30px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
              <h2 style="color: #166534; margin: 0 0 20px 0;">🎉 Welcome to Boetos!</h2>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                Hi ${name},
              </p>
              
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                Great news! Your email has been successfully verified. Your Boetos account is now fully activated 
                and you have access to all features including:
              </p>
              
              <ul style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                <li>AI-powered burnout tracking and prevention</li>
                <li>Smart calendar management</li>
                <li>Voice assistant capabilities</li>
                <li>Memory and task management</li>
                <li>Personalized insights and recommendations</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; 
                          border-radius: 8px; font-weight: 600; display: inline-block;">
                  Get Started
                </a>
              </div>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px;">
              <p>Thank you for choosing Boetos!</p>
            </div>
          </div>
        `
      });

      if (error) {
        console.error('Resend API error:', error);
        throw new Error('Failed to send welcome email');
      }

      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }
}

module.exports = EmailService; 