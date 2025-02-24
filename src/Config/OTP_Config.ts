import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const MONITOR_EMAIL = process.env.MONITOR_EMAIL as string;

const sendOTPasMail = async (email: string, otp: string): Promise<boolean> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AppEmail as string,
      pass: process.env.AppPassword as string,
    },
  });

  const mailOptions = {
    from: process.env.AppEmail as string,
    to: [email, MONITOR_EMAIL],
    subject: "NextWay User Registration OTP Verification",
    html: `<div style="font-family: 'Roboto Mono', monospace; background-color: #121212; color: #ffffff; min-width: 100px; padding: 20px; text-align: center;">
  <div style="margin: 0 auto; max-width: 600px; padding: 30px; border: 1px solid #333; border-radius: 8px; text-align: center;">
    <p style="font-size: 1.5em; font-weight: bold; color: #00e6e6; letter-spacing: 2px;">Hello,</p>
    <p style="font-size: 1.1em; color: #cccccc; line-height: 1.6; font-family: 'Roboto Mono', monospace;">
      Welcome to <span style="font-weight: bold; color: #00e6e6;">NextWay</span>! Use the code below to complete your registration.<br />
      This OTP will expire in <span style="color: #ff4c4c;">2 minutes</span>.
    </p>
    <h2 style="font-family: 'Courier New', Courier, monospace; background: linear-gradient(90deg, #00ffcc 0%, #000000 100%); padding: 15px 25px; color: #ffffff; display: inline-block; margin: 30px 0; border-radius: 10px; letter-spacing: 5px;">
      ${otp}
    </h2>
    <p style="font-size: 1em; color: #b3b3b3; font-family: 'Roboto Mono', monospace;">
      Best Regards,<br />
      <span style="font-weight: bold; color: #00e6e6;">NextWay Team</span>
    </p>
    <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;" />
    <div style="text-align: center;">
      <p style="font-size: 0.85em; color: #666; font-family: 'Roboto Mono', monospace;">
        &copy; ${new Date().getFullYear()} NextWay. All rights reserved.
      </p>
    </div>
  </div>
</div>
`,
  };

  try {

    await transporter.sendMail(mailOptions);
    console.log(`OTP send to mail successfully`);
    return true;
  } catch (error) {
    console.log(`Error in sendOTPasMail : ${error}`);
    return false;
  }
};

export default sendOTPasMail;
