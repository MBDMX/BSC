import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};
  const targetEmail = email || process.env.TEST_NOTIFICATION_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return res.status(200).json({
      message: 'Email simulé (RESEND_API_KEY non configuré)',
      details: { status: 'sent', note: 'Configurez RESEND_API_KEY dans les variables Vercel', to: targetEmail }
    });
  }

  if (!targetEmail) {
    return res.status(400).json({ error: 'Adresse email requise' });
  }

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Burger Social Club <onboarding@resend.dev>',
        to: [targetEmail],
        subject: '🍔 Burger Social Club - Test de Notification Email',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f7fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              <h2 style="color: #03224c; margin-top: 0; display: flex; align-items: center; gap: 8px;">
                🍔 Burger Social Club
              </h2>
              <p style="color: #2d3748; font-size: 16px;">Bonjour,</p>
              <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
                Votre système de notification par email est maintenant <strong>parfaitement configuré et actif</strong> sur votre plateforme Cloud (Vercel) !
              </p>
              <div style="background-color: #f0fff4; border-left: 4px solid #38a169; padding: 14px 18px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; color: #22543d; font-weight: 600; font-size: 14px;">✅ Statut : Service Opérationnel</p>
                <p style="margin: 4px 0 0 0; color: #276749; font-size: 13px;">Destinataire : ${targetEmail}</p>
                <p style="margin: 2px 0 0 0; color: #276749; font-size: 13px;">Date d'envoi : ${new Date().toLocaleString('fr-FR')}</p>
              </div>
              <p style="color: #718096; font-size: 13px; margin-top: 25px; border-top: 1px solid #edf2f7; pt: 15px;">
                Ce message a été généré automatiquement par Burger Social Club ERP.
              </p>
            </div>
          </div>
        `
      })
    });

    const data = await resendResponse.json();

    if (resendResponse.ok) {
      return res.status(200).json({
        message: 'Email envoyé avec succès',
        details: { status: 'sent', id: data.id, to: targetEmail }
      });
    } else {
      console.error('Resend API error response:', data);
      return res.status(400).json({
        error: data.message || 'Erreur Resend',
        details: { status: 'failed', resend_error: data, to: targetEmail }
      });
    }
  } catch (err: any) {
    console.error('Error sending email:', err);
    return res.status(500).json({ error: err.message || 'Erreur lors de l\'envoi' });
  }
}
