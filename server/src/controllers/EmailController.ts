import { Response } from 'express';
import EmailService from '../services/EmailService';
import UserRepository from '../repositories/UserRepository';
import { AuthRequest } from '../middleware/authMiddleware';

export async function sendPDF(req: AuthRequest, res: Response) {
  try {
    const { to, subject, body, clientName } = req.body;
    const file = req.file;
    const userId = req.userId; // From auth middleware

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (!to) {
      return res.status(400).json({ error: 'Destinatário não informado.' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Arquivo do relatório não encontrado.' });
    }

    const testRecipient = 'jalexandrino@cervejariacidadeimperial.com.br';
    const originalTo = to;
    const recipient = testRecipient;

    const formattedBody = body
      ? body.replaceAll('\n', '<br>')
      : 'Segue em anexo o relatório detalhado da auditoria energética realizada.';

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            width: 100%;
            background-color: #f8fafc;
            padding: 40px 0;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          }
          .header {
            padding: 32px 40px 24px 40px;
          }
          .brand-name {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            display: block;
            line-height: 1.2;
          }
          .brand-sub {
            font-size: 12px;
            color: #64748b;
            display: block;
            margin-top: 2px;
          }
          .content {
            padding: 0 40px 32px 40px;
          }
          .body-text {
            font-size: 15px;
            color: #334155;
            margin-bottom: 24px;
            line-height: 1.6;
          }
          .attachment-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            width: 100%;
            margin-top: 24px;
          }
          .pdf-badge {
            background-color: #fef2f2;
            color: #ef4444;
            font-weight: 700;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #fca5a5;
            font-family: monospace;
            display: inline-block;
          }
          .attachment-name {
            font-weight: 600;
            font-size: 14px;
            color: #0f172a;
            display: block;
          }
          .attachment-sub {
            font-size: 12px;
            color: #64748b;
            display: block;
            margin-top: 2px;
          }
          .footer {
            padding: 24px 40px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            margin: 0;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <!-- Brand Line Destaque -->
            <div style="height: 4px; background-color: #0069a8; font-size: 1px; line-height: 1px;">&nbsp;</div>
            
            <!-- Header -->
            <div class="header">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="48" style="vertical-align: middle; padding-right: 12px;">
                    <img src="cid:logo_em" alt="Audit Energy Logo" width="40" height="40" style="display: block; border: 0;" />
                  </td>
                  <td style="vertical-align: middle; text-align: left;">
                    <span class="brand-name">Audit Energy</span>
                    <span class="brand-sub">Sistema de Auditoria Energética</span>
                  </td>
                </tr>
              </table>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 0 0;" />
            </div>

            <!-- Content -->
            <div class="content">
              <!-- Homologação Alert -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td width="20" style="vertical-align: top; padding-right: 8px;">
                      <span style="color: #16a34a; font-weight: bold; font-size: 14px;">ℹ</span>
                    </td>
                    <td style="font-size: 13px; color: #166534; line-height: 1.5; text-align: left;">
                      <strong>Ambiente de Homologação:</strong> Este e-mail foi direcionado para <strong>${testRecipient}</strong> para fins de teste.
                      <br>
                      <span style="font-size: 11px; opacity: 0.85;">Destinatário original: ${originalTo}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <div class="body-text">
                ${formattedBody}
              </div>
              
              <!-- Anexo Info -->
              <table cellpadding="16" cellspacing="0" border="0" class="attachment-card">
                <tr>
                  <td width="50" style="vertical-align: middle; padding-right: 0;">
                    <div class="pdf-badge">PDF</div>
                  </td>
                  <td style="vertical-align: middle; text-align: left; padding-left: 12px;">
                    <span class="attachment-name">${file.originalname || 'relatorio-energia.pdf'}</span>
                    <span class="attachment-sub">O relatório técnico detalhado está disponível em anexo.</span>
                  </td>
                </tr>
              </table>

              <!-- Assinatura -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
                <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Enviado por</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #0f172a;">${user.nome}</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">${user.email}</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Audit Energy | Gestão e Auditoria de Faturas</p>
              <p style="margin-top: 6px; font-size: 11px;">Este é um e-mail automático enviado pelo sistema. Por favor, não responda diretamente a esta mensagem.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await EmailService.sendPDFReport({
      to: recipient,
      subject: subject || 'Relatório de Auditoria Energética - Audit Energy',
      text: body || 'Olá, segue em anexo o seu relatório de auditoria energética.',
      html: htmlTemplate,
      attachment: {
        filename: file.originalname || 'relatorio-energia.pdf',
        content: file.buffer,
      },
      senderInfo: {
        name: user.nome,
        email: user.email,
      },
    });

    res.status(200).json({ message: 'E-mail enviado com sucesso!' });
  } catch (error: any) {
    console.error('Erro no EmailController:', error);
    res.status(500).json({ error: 'Erro ao enviar e-mail: ' + error.message });
  }
}
