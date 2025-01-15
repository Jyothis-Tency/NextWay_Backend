import nodemailer from "nodemailer";
import dotenv from "dotenv";
import User from "../Models/userModel";

dotenv.config();

const myEmail = "jyothisgtency@gmail.com";

interface EmailTemplate {
  subject: string;
  heading: string;
  mainContent: string;
  additionalInfo?: {
    label: string;
    value: string;
  }[];
}

const templates = {
  newJob: (
    companyName: string,
    jobTitle: string,
    location: string
  ): EmailTemplate => ({
    subject: "NextGig - New Job Opportunity Alert!",
    heading: "Hello from NextGig!",
    mainContent: `A new job opportunity awaits you at <span style="font-weight: bold; color: #00e6e6;">${companyName}</span>`,
    additionalInfo: [
      { label: "Position", value: jobTitle },
      { label: "Location", value: location },
    ],
  }),

  applicationStatus: (
    companyName: string,
    jobTitle: string,
    status: string
  ): EmailTemplate => ({
    subject: "NextGig - Application Status Update",
    heading: "Application Status Update",
    mainContent: `Your application status has been updated for the position at <span style="font-weight: bold; color: #00e6e6;">${companyName}</span>`,
    additionalInfo: [
      { label: "Position", value: jobTitle },
      { label: "New Status", value: status },
    ],
  }),
};

const generateEmailHTML = (template: EmailTemplate): string => {
  const additionalInfoHTML = template.additionalInfo
    ? template.additionalInfo
        .map(
          (info) => `
          <p style="color: #cccccc; margin: 5px 0;">
            ${info.label}: <span style="color: #00e6e6;">${info.value}</span>
          </p>
        `
        )
        .join("")
    : "";

  return `
    <div style="font-family: 'Roboto Mono', monospace; background-color: #121212; color: #ffffff; min-width: 100px; padding: 20px; text-align: center;">
      <div style="margin: 0 auto; max-width: 600px; padding: 30px; border: 1px solid #333; border-radius: 8px; text-align: center;">
        <p style="font-size: 1.5em; font-weight: bold; color: #00e6e6; letter-spacing: 2px;">${
          template.heading
        }</p>
        
        <p style="font-size: 1.1em; color: #cccccc; line-height: 1.6; font-family: 'Roboto Mono', monospace;">
          ${template.mainContent}
        </p>

        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${additionalInfoHTML}
        </div>

        <p style="font-size: 1em; color: #b3b3b3; font-family: 'Roboto Mono', monospace;">
          Log in to <span style="font-weight: bold; color: #00e6e6;">NextGig</span> now to view complete details!
        </p>

        <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;" />
        <div style="text-align: center;">
          <p style="font-size: 0.85em; color: #666; font-family: 'Roboto Mono', monospace;">
            &copy; ${new Date().getFullYear()} NextGig. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;
};

interface SendEmailOptions {
  recipients: string[];
  template: EmailTemplate;
  useBcc?: boolean;
}

const sendEmail = async ({
  recipients,
  template,
  useBcc = true,
}: SendEmailOptions): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AppEmail as string,
        pass: process.env.AppPassword as string,
      },
    });

    const mailOptions = {
      from: process.env.AppEmail as string,
      ...(useBcc
        ? { bcc: [...recipients, myEmail] }
        : { to: [...recipients, myEmail] }),
      subject: template.subject,
      html: generateEmailHTML(template),
    };

    console.log(
      `ENV Email and Password : ${process.env.AppEmail},${process.env.AppPassword}`
    );
    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent successfully`);
    return true;
  } catch (error) {
    console.log(`Error in sendEmail : ${error}`);
    return false;
  }
};

// Helper functions for common use cases
const sendNewJobNotification = async (
  companyName: string,
  jobTitle: string,
  location: string
): Promise<boolean> => {
  try {
    const users = await User.find({ isBlocked: false }, { email: 1 });
    const userEmails = users.map((user) => user.email);

    return await sendEmail({
      recipients: userEmails,
      template: templates.newJob(companyName, jobTitle, location),
      useBcc: true,
    });
  } catch (error) {
    console.log(`Error in sendNewJobNotification : ${error}`);
    return false;
  }
};

const sendApplicationStatusUpdate = async (
  userEmail: string,
  companyName: string,
  jobTitle: string,
  status: string
): Promise<boolean> => {
  return await sendEmail({
    recipients: [userEmail],
    template: templates.applicationStatus(companyName, jobTitle, status),
    useBcc: false,
  });
};

export {
  sendNewJobNotification,
  sendApplicationStatusUpdate,
  sendEmail,
  templates,
};
