import nodemailer, { Transporter } from 'nodemailer';
import path from 'path';
import fs from 'fs';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachment: {
    filename: string;
    content: Buffer | string;
  };
  senderInfo?: {
    name: string;
    email: string;
  };
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Sends an email with a PDF attachment
   */
  async sendPDFReport({ to, subject, text, html, attachment, senderInfo }: EmailOptions): Promise<any> {
    const fromName = process.env.SMTP_FROM_NAME || 'Audit Energy';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    const logoPath = path.join(__dirname, '../../../src/assets/logo-em.png');
    const attachments: any[] = [
      {
        filename: attachment.filename,
        content: attachment.content,
        contentType: 'application/pdf',
      },
    ];

    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'logo-em.png',
        path: logoPath,
        cid: 'logo_em',
      });
    }

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html,
      attachments,
      // Set Reply-To as the logged-in user's email
      replyTo: senderInfo ? `"${senderInfo.name}" <${senderInfo.email}>` : undefined,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

export default new EmailService();
