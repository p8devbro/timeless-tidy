const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendRegistrationCode = async (email, name, code) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@timeless-tidy.com",
    to: email,
    subject: "Your Worker Registration Code",
    html: `
      <h1>Welcome to Timeless Tidy!</h1>
      <p>Dear ${name},</p>
      <p>Your application has been accepted. Please use the following code to complete your registration:</p>
      <h2 style="background-color: #f4f4f4; padding: 10px; text-align: center;">${code}</h2>
      <p>This code will be required to set up your account.</p>
      <p>Best regards,<br>Timeless Tidy Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

const sendWorkerSelectionNotification = async (
  workerEmail,
  workerName,
  serviceDetails
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@timeless-tidy.com",
    to: workerEmail,
    subject: "You've Been Selected for a Cleaning Service",
    html: `
      <h1>Congratulations!</h1>
      <p>Dear ${workerName},</p>
      <p>You have been selected for a cleaning service with the following details:</p>
      <div style="background-color: #f4f4f4; padding: 15px; margin: 15px 0;">
        <p><strong>Address:</strong> ${serviceDetails.address.street}, ${
      serviceDetails.address.city
    }, ${serviceDetails.address.state} ${serviceDetails.address.zipCode}</p>
        <p><strong>Date:</strong> ${new Date(
          serviceDetails.firstClean.date
        ).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${serviceDetails.firstClean.time}</p>
        <p><strong>Bedrooms:</strong> ${serviceDetails.bedrooms}</p>
        <p><strong>Bathrooms:</strong> ${serviceDetails.bathrooms}</p>
        <p><strong>Frequency:</strong> ${serviceDetails.frequency}</p>
        <p><strong>Price:</strong> $${serviceDetails.price}</p>
      </div>
      <p>Please make sure to arrive on time and bring all necessary cleaning supplies.</p>
      <p>Best regards,<br>Timeless Tidy Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

const sendClientCredentials = async (email, name, password) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your Timeless Tidy Login Credentials",
      html: `
        <h1>Welcome to Timeless Tidy!</h1>
        <p>Dear ${name},</p>
        <p>Thank you for posting your cleaning service with us. Your account has been created successfully.</p>
        <p>Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>Please use these credentials to log in to your account. For security reasons, we recommend changing your password after your first login.</p>
        <p>You can now view and manage your cleaning services through your account.</p>
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The Timeless Tidy Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending client credentials email:", error);
    throw error;
  }
};

module.exports = {
  sendRegistrationCode,
  sendWorkerSelectionNotification,
  sendClientCredentials,
};
