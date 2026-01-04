import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: `"Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Votre code de vérification",
    html: `
        <h2>Code de vérification</h2>
        <p>Votre code OTP est :</p>
        <p><strong>${otp}</strong></p>
        <p>Ce code expire dans 10 minutes.</p>
        `,
  });
}
