import nodemailer from 'nodemailer';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

export const getMailTransporter = (): Promise<nodemailer.Transporter> => {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = new Promise(async (resolve, reject) => {
    try {
      // If custom SMTP config is provided in .env, use it
      if (
        process.env.EMAIL_HOST &&
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASS
      ) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_PORT === '465',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        console.log('✅ Mail Service: Using custom SMTP configuration.');
        return resolve(transporter);
      }

      // Fallback: Generate an Ethereal Email test account automatically
      console.log('⚙️ Mail Service: Creating Ethereal Email test account...');
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('✅ Mail Service: Using Ethereal test SMTP.');
      console.log(`- Username: ${testAccount.user}`);
      console.log(`- Host: ${testAccount.smtp.host}`);
      return resolve(transporter);
    } catch (error) {
      console.error('❌ Failed to configure mail transporter:', error);
      reject(error);
    }
  });

  return transporterPromise;
};
