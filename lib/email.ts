import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: `"CarID" <${process.env.EMAIL_FROM || 'noreply@carid.com'}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export const emailTemplates = {
  transferApproved: (userName: string, transferId: string) => ({
    subject: '✅ Traspaso Aprobado',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Traspaso Aprobado!</h2>
        <p>Hola ${userName},</p>
        <p>El administrador ha aprobado tu traspaso de vehículo.</p>
        <p>Puedes ver los detalles del traspaso aquí:</p>
        <p>
          <a href="${process.env.NEXTAUTH_URL}/dashboard/transfers/${transferId}" 
             style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
            Ver Traspaso
          </a>
        </p>
        <p>Gracias por usar CarID.</p>
      </div>
    `,
  }),
  transferRejected: (userName: string, reason?: string) => ({
    subject: '❌ Traspaso Rechazado',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Traspaso Rechazado</h2>
        <p>Hola ${userName},</p>
        <p>Lamentamos informarte que el administrador ha rechazado tu solicitud de traspaso.</p>
        ${reason ? `<p><strong>Razón:</strong> ${reason}</p>` : ''}
        <p>Por favor, contacta con soporte si necesitas más información.</p>
        <p>Gracias por usar CarID.</p>
      </div>
    `,
  }),
  transferUpdate: (userName: string, status: string, transferId: string) => ({
    subject: `Actualización de Traspaso - ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Actualización de Traspaso</h2>
        <p>Hola ${userName},</p>
        <p>El estado de tu traspaso ha sido actualizado a: <strong>${status}</strong>.</p>
        <p>Puedes ver los detalles del traspaso aquí:</p>
        <p>
          <a href="${process.env.NEXTAUTH_URL}/dashboard/transfers/${transferId}" 
             style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
            Ver Traspaso
          </a>
        </p>
        <p>Gracias por usar CarID.</p>
      </div>
    `,
  }),
};
