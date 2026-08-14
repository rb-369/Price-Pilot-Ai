/**
 * Check currently active email provider status for diagnostics (Brevo API)
 */
exports.getEmailStatus = () => {
    const brevoKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '').trim();
    const fromEmail = (process.env.BREVO_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'notifications@pricepilot.ai').trim();
    const fromName = (process.env.BREVO_FROM_NAME || process.env.EMAIL_FROM_NAME || 'PricePilot AI').trim();
    const sendgridKey = (process.env.SENDGRID_API_KEY || '').trim();

    return {
        provider: brevoKey ? 'Brevo' : sendgridKey ? 'SendGrid' : 'DevLog',
        brevoConfigured: Boolean(brevoKey),
        sendgridConfigured: Boolean(sendgridKey),
        fromEmail,
        fromName,
        apiKeyPrefix: brevoKey ? `${brevoKey.slice(0, 10)}...` : sendgridKey ? `${sendgridKey.slice(0, 7)}...` : null
    };
};

/**
 * Send welcome onboarding email when a new user registers
 */
exports.sendWelcomeEmail = async (user) => {
    if (!user?.email) return;

    const userName = user.name || 'Merchant';
    const clientUrl = (process.env.CLIENT_URL || 'https://price-pilot-ai-369.vercel.app').trim();
    const subject = `Welcome to PricePilot AI — Powering Your Autonomous Dynamic Pricing`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to PricePilot AI</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111827; border-radius: 16px; border: 1px solid rgba(99, 102, 241, 0.2); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                            <!-- Header Gradient Accent -->
                            <tr>
                                <td height="6" style="background: linear-gradient(90deg, #6366f1, #a855f7, #ec4899);"></td>
                            </tr>
                            <!-- Header Section -->
                            <tr>
                                <td style="padding: 36px 36px 20px 36px;">
                                    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                        Welcome aboard, ${userName}! 🚀
                                    </h1>
                                    <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.5;">
                                        Your autonomous dynamic pricing copilot is ready to protect margins and scale profits.
                                    </p>
                                </td>
                            </tr>
                            <!-- Feature Highlight Cards -->
                            <tr>
                                <td style="padding: 0 36px 24px 36px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 12px; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.5px;">
                                                    ⚡ What you can do right now:
                                                </h3>
                                                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                                                    <li><strong>Sync Products & Channels:</strong> Connect Amazon, Shopify, Flipkart, or WooCommerce.</li>
                                                    <li><strong>Real-time Competitor Scraping:</strong> Track competitor prices with live undercut alerts.</li>
                                                    <li><strong>AI Price Optimization:</strong> Discover elasticity curve pricing to maximize net revenue.</li>
                                                    <li><strong>Ask AI Copilot:</strong> Query revenue insights & forecasts across your entire catalog.</li>
                                                </ul>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <!-- CTA Button -->
                            <tr>
                                <td align="center" style="padding: 0 36px 36px 36px;">
                                    <table cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #6366f1, #4f46e5); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);">
                                                <a href="${clientUrl}/dashboard" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">
                                                    Open Your Dashboard &rarr;
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #0d1322; padding: 24px 36px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
                                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                                        PricePilot AI &bull; Autonomous Pricing & Inventory Intelligence
                                    </p>
                                    <p style="margin: 0; font-size: 11px; color: #475569;">
                                        Need help getting set up? Reply directly to this email to reach our support team.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return _sendMail(user.email, subject, html);
};

/**
 * Send low-stock or critical inventory alert email to merchant
 */
exports.sendLowStockAlert = async (user, product) => {
    if (!user?.email || !product) return;

    const clientUrl = (process.env.CLIENT_URL || 'https://price-pilot-ai-369.vercel.app').trim();
    const subject = `🚨 Critical Inventory Alert: "${product.name}" is Low on Stock`;
    const threshold = product.reorderThreshold !== undefined ? product.reorderThreshold : 10;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Low Stock Alert</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0b0f19; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111827; border-radius: 16px; border: 1px solid rgba(239, 68, 68, 0.3); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                            <!-- Red Header Gradient Accent -->
                            <tr>
                                <td height="6" style="background: linear-gradient(90deg, #ef4444, #f97316);"></td>
                            </tr>
                            <!-- Content -->
                            <tr>
                                <td style="padding: 36px 36px 20px 36px;">
                                    <div style="display: inline-block; padding: 4px 12px; border-radius: 20px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
                                        Stockout Risk Detected
                                    </div>
                                    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                                        Inventory Running Low: ${product.name}
                                    </h1>
                                    <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                                        SKU: <code style="background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #38bdf8;">${product.sku || 'N/A'}</code>
                                    </p>
                                </td>
                            </tr>
                            <!-- Details Box -->
                            <tr>
                                <td style="padding: 0 36px 24px 36px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px;">
                                        <tr>
                                            <td width="50%" style="padding: 16px; border-right: 1px solid rgba(239, 68, 68, 0.1);">
                                                <div style="font-size: 12px; color: #94a3b8;">Current Units Left</div>
                                                <div style="font-size: 28px; font-weight: 900; color: #ef4444; margin-top: 4px;">
                                                    ${product.stockLevel || 0}
                                                </div>
                                            </td>
                                            <td width="50%" style="padding: 16px;">
                                                <div style="font-size: 12px; color: #94a3b8;">Reorder Threshold</div>
                                                <div style="font-size: 28px; font-weight: 900; color: #f59e0b; margin-top: 4px;">
                                                    ${threshold}
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <!-- CTA -->
                            <tr>
                                <td align="center" style="padding: 0 36px 36px 36px;">
                                    <a href="${clientUrl}/dashboard/products" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #dc2626);">
                                        Manage Inventory in Dashboard &rarr;
                                    </a>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #0d1322; padding: 20px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                                        PricePilot Inventory Monitor &bull; Real-time Stock Protection
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return _sendMail(user.email, subject, html);
};

/**
 * Send password reset OTP / Link email
 */
exports.sendPasswordResetEmail = async (email, resetUrl) => {
    if (!email) return;

    const subject = `Reset Your PricePilot AI Password`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0b0f19; color: #f1f5f9; border-radius: 12px;">
            <h2 style="color: #6366f1;">PricePilot AI Password Reset</h2>
            <p>You requested to reset your password. Click the link below to set a new password:</p>
            <p style="margin: 24px 0;">
                <a href="${resetUrl}" style="background: #6366f1; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Reset Password
                </a>
            </p>
            <p style="color: #94a3b8; font-size: 12px;">If you did not request this, please ignore this email. The link expires in 1 hour.</p>
        </div>
    `;

    return _sendMail(email, subject, html);
};

/**
 * Send generic notification email (e.g. feedback/report alerts)
 */
exports.sendNotificationEmail = async (subject, htmlContent, recipient = null) => {
    const fromEmail = (process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER || 'notifications@pricepilot.ai').trim();
    const to = recipient || process.env.ADMIN_NOTIFICATION_EMAIL || fromEmail;
    return _sendMail(to, subject, htmlContent);
};

/**
 * Test email dispatcher for Brevo diagnostics
 */
exports.sendTestEmail = async (targetEmail) => {
    const subject = `🧪 PricePilot AI Brevo Delivery Test (${new Date().toLocaleTimeString()})`;
    const html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; background: #0b0f19; color: #f1f5f9; border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.3);">
            <h2 style="color: #6366f1; margin-top: 0;">Brevo Email Delivery Operational! ✅</h2>
            <p>This confirms that your PricePilot AI Brevo configuration (300 emails/day) is working properly.</p>
            <p style="color: #94a3b8; font-size: 13px;">Timestamp: ${new Date().toISOString()}</p>
        </div>
    `;
    return _sendMail(targetEmail, subject, html);
};

/**
 * Core dispatch function handling Brevo v3 REST API delivery
 */
async function _sendMail(to, subject, html) {
    if (!to) return { success: false, reason: 'missing_recipient' };

    const brevoKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '').trim();
    const fromEmail = (process.env.BREVO_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'notifications@pricepilot.ai').trim();
    const fromName = (process.env.BREVO_FROM_NAME || process.env.EMAIL_FROM_NAME || 'PricePilot AI').trim();

    // 1. Brevo v3 REST API Dispatch (Zero-dependency, 300 free emails/day)
    if (brevoKey) {
        try {
            const payload = {
                sender: {
                    name: fromName,
                    email: fromEmail
                },
                to: [
                    {
                        email: to
                    }
                ],
                subject: subject,
                htmlContent: html
            };

            const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': brevoKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                console.log(`[EmailService/Brevo] Successfully delivered email "${subject}" to <${to}> (MessageId: ${data.messageId || 'OK'})`);
                return { success: true, provider: 'brevo', messageId: data.messageId };
            } else {
                console.error(`[EmailService/Brevo Error] Delivery failed to <${to}>:`, JSON.stringify(data));
                return {
                    success: false,
                    provider: 'brevo',
                    error: data.message || `HTTP ${res.status}`,
                    details: data
                };
            }
        } catch (err) {
            console.error(`[EmailService/Brevo Error] Network exception sending to <${to}>:`, err.message);
            return {
                success: false,
                provider: 'brevo',
                error: err.message
            };
        }
    }

    // Fallback development logger when BREVO_API_KEY is not configured
    console.log(`[EmailService/DevLog] Email prepared for <${to}>: "${subject}" (configured provider: Brevo=false)`);
    return { success: false, reason: 'brevo_not_configured' };
}
