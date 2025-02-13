import nodemailer from "nodemailer";
import Queue from 'bull'
import dotenv from "dotenv";
import User from "../Models/userModel";

dotenv.config();

const MONITOR_EMAIL = process.env.MONITOR_EMAIL as string;

interface EmailTemplate {
  subject: string;
  heading: string;
  mainContent: string;
  additionalInfo?: {
    label: string;
    value: string;
  }[];
}

interface SendEmailResult {
  email: string;
  success: boolean;
  error?: string;
}

const templates = {
  newJob: (
    companyName: string,
    jobTitle: string,
    location: string
  ): EmailTemplate => ({
    subject: "NextWay - New Job Opportunity Alert!",
    heading: "Hello from NextWay!",
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
    subject: "NextWay - Application Status Update",
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
          Log in to <span style="font-weight: bold; color: #00e6e6;">NextWay</span> now to view complete details!
        </p>

        <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;" />
        <div style="text-align: center;">
          <p style="font-size: 0.85em; color: #666; font-family: 'Roboto Mono', monospace;">
            &copy; ${new Date().getFullYear()} NextWay. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `;
};

const sendSingleEmail = async (
  recipient: string,
  template: EmailTemplate
): Promise<SendEmailResult> => {
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
      to: recipient,
      subject: template.subject,
      html: generateEmailHTML(template),
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${recipient}`);
    return { email: recipient, success: true };
  } catch (error) {
    console.log(`Failed to send email to ${recipient}: ${error}`);
    return {
      email: recipient,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const sendEmail = async ({
  recipients,
  template,
  useBcc = true,
}: {
  recipients: string[];
  template: EmailTemplate;
  useBcc?: boolean;
}): Promise<SendEmailResult[]> => {
  const results: SendEmailResult[] = [];

  // Always try to send to monitoring email
  try {
    await sendSingleEmail(MONITOR_EMAIL, template);
  } catch (error) {
    console.log(`Failed to send monitoring email: ${error}`);
  }

  // Send to each recipient individually
  for (const recipient of recipients) {
    const result = await sendSingleEmail(recipient, template);
    results.push(result);
  }

  // Log summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(
    `Email sending complete. Success: ${successful}, Failed: ${failed}`
  );

  return results;
};

const sendNewJobNotification = async (
  companyName: string,
  jobTitle: string,
  location: string
): Promise<SendEmailResult[]> => {
  try {
    const users = await User.find(
      {
        isBlocked: false,
        isSubscribed: true,
        subscriptionFeatures: { $in: ["google_notification"] },
      },
      { email: 1 }
    );
    const userEmails = users.map((user) => user.email);

    return await sendEmail({
      recipients: userEmails,
      template: templates.newJob(companyName, jobTitle, location),
      useBcc: true,
    });
  } catch (error) {
    console.log(`Error in sendNewJobNotification: ${error}`);
    return [];
  }
};

const sendApplicationStatusUpdate = async (
  userEmail: string,
  companyName: string,
  jobTitle: string,
  status: string
): Promise<SendEmailResult[]> => {
  console.log(`Sending application status update to ${userEmail}`);
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
  SendEmailResult,
};
