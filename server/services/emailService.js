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
    const subject = `Welcome to PricePilot AI — Powering Your Autonomous Dynamic Pricing 🚀`;
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to PricePilot AI</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; -webkit-font-smoothing: antialiased;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #060913; padding: 40px 16px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #0d1326; border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.25); overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);">
                            <!-- Top Brand Gradient Bar -->
                            <tr>
                                <td height="5" style="background: linear-gradient(90deg, #6366f1 0%, #06b6d4 50%, #10b981 100%);"></td>
                            </tr>

                            <!-- Brand Header -->
                            <tr>
                                <td style="padding: 36px 36px 16px 36px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td>
                                                <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.28); color: #818cf8; font-size: 11px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 16px;">
                                                    ⚡ Autonomous Intelligence Platform
                                                </div>
                                                <h1 style="margin: 0 0 10px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.6px; line-height: 1.25;">
                                                    Welcome aboard, ${userName}! 🚀
                                                </h1>
                                                <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">
                                                    Your autonomous pricing copilot is configured and ready to maximize profit margins, defend market share, and automate multi-channel inventory.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- 3 Step Quickstart Guide -->
                            <tr>
                                <td style="padding: 10px 36px 24px 36px;">
                                    <div style="background-color: rgba(19, 27, 46, 0.7); border: 1px solid rgba(99, 102, 241, 0.16); border-radius: 16px; padding: 22px; margin-bottom: 24px;">
                                        <h2 style="margin: 0 0 16px 0; font-size: 13px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.6px;">
                                            🎯 3 Quick Steps to Launch:
                                        </h2>

                                        <!-- Step 1 -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
                                            <tr>
                                                <td width="36" valign="top">
                                                    <div style="width: 26px; height: 26px; border-radius: 8px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); color: #818cf8; font-size: 12px; font-weight: 800; text-align: center; line-height: 26px;">1</div>
                                                </td>
                                                <td valign="top" style="padding-left: 8px;">
                                                    <strong style="color: #f1f5f9; font-size: 14px;">Import Products &amp; SKU Links</strong>
                                                    <p style="margin: 3px 0 0 0; font-size: 12.5px; color: #94a3b8; line-height: 1.45;">
                                                        Paste product URLs from Amazon, Flipkart, or Shopify to auto-extract live selling prices and specs in 1 click.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Step 2 -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 14px;">
                                            <tr>
                                                <td width="36" valign="top">
                                                    <div style="width: 26px; height: 26px; border-radius: 8px; background: rgba(6, 182, 212, 0.2); border: 1px solid rgba(6, 182, 212, 0.4); color: #22d3ee; font-size: 12px; font-weight: 800; text-align: center; line-height: 26px;">2</div>
                                                </td>
                                                <td valign="top" style="padding-left: 8px;">
                                                    <strong style="color: #f1f5f9; font-size: 14px;">Review AI Repricing &amp; Elasticity</strong>
                                                    <p style="margin: 3px 0 0 0; font-size: 12.5px; color: #94a3b8; line-height: 1.45;">
                                                        Gemini AI monitors competitor undercuts and computes revenue-maximizing prices backed by XAI explainability.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Step 3 -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td width="36" valign="top">
                                                    <div style="width: 26px; height: 26px; border-radius: 8px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 12px; font-weight: 800; text-align: center; line-height: 26px;">3</div>
                                                </td>
                                                <td valign="top" style="padding-left: 8px;">
                                                    <strong style="color: #f1f5f9; font-size: 14px;">Simulate What-If Revenue Impacts</strong>
                                                    <p style="margin: 3px 0 0 0; font-size: 12.5px; color: #94a3b8; line-height: 1.45;">
                                                        Interactive A/B pricing experiments let you test margin changes risk-free before syncing live to customers.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- Action Button Call to Action -->
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td align="center">
                                                <table cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); box-shadow: 0 10px 25px -4px rgba(99, 102, 241, 0.45);">
                                                            <a href="${clientUrl}/dashboard" target="_blank" style="display: inline-block; padding: 15px 36px; font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.2px;">
                                                                Launch Your Command Center &rarr;
                                                            </a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Need Help & Quick Links Bar -->
                            <tr>
                                <td style="padding: 16px 36px 28px 36px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 18px;">
                                        <tr>
                                            <td align="center" style="font-size: 12px; color: #94a3b8;">
                                                Need assistance or looking for API docs? Explore the
                                                <a href="${clientUrl}/docs" target="_blank" style="color: #818cf8; text-decoration: underline; font-weight: 600;">Documentation Hub</a>
                                                or reply directly to this email.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Footer Section -->
                            <tr>
                                <td style="background-color: #070b16; padding: 22px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                                        PricePilot AI &bull; Autonomous Pricing &amp; Multi-Channel Inventory Intelligence
                                    </p>
                                    <p style="margin: 0; font-size: 11px; color: #475569;">
                                        Protected by 256-bit encryption &bull; Real-time Market Defense
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
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Low Stock Alert</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #060913; padding: 40px 16px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #0d1326; border-radius: 20px; border: 1px solid rgba(239, 68, 68, 0.35); overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);">
                            <!-- Red Header Gradient Accent -->
                            <tr>
                                <td height="5" style="background: linear-gradient(90deg, #ef4444 0%, #f97316 100%);"></td>
                            </tr>

                            <!-- Content Section -->
                            <tr>
                                <td style="padding: 36px 36px 16px 36px;">
                                    <div style="display: inline-block; padding: 5px 12px; border-radius: 20px; background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(239, 68, 68, 0.35); color: #f87171; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 14px;">
                                        🚨 Urgent Stockout Risk Detected
                                    </div>
                                    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                        ${product.name}
                                    </h1>
                                    <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                                        SKU: <code style="background: #1e293b; padding: 3px 8px; border-radius: 6px; color: #38bdf8; font-weight: 700; font-size: 13px;">${product.sku || 'N/A'}</code>
                                    </p>
                                </td>
                            </tr>

                            <!-- Inventory Gauge Numbers -->
                            <tr>
                                <td style="padding: 10px 36px 24px 36px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 14px; margin-bottom: 22px;">
                                        <tr>
                                            <td width="50%" style="padding: 18px; border-right: 1px solid rgba(239, 68, 68, 0.15); text-align: center;">
                                                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Current Stock</div>
                                                <div style="font-size: 32px; font-weight: 900; color: #ef4444; margin-top: 4px;">
                                                    ${product.stockLevel || 0}
                                                </div>
                                            </td>
                                            <td width="50%" style="padding: 18px; text-align: center;">
                                                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Reorder Threshold</div>
                                                <div style="font-size: 32px; font-weight: 900; color: #f59e0b; margin-top: 4px;">
                                                    ${threshold}
                                                </div>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- CTA -->
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td align="center">
                                                <a href="${clientUrl}/dashboard/products" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 14px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 12px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 8px 20px -3px rgba(239, 68, 68, 0.4);">
                                                    Restock Inventory in Dashboard &rarr;
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #070b16; padding: 20px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                                        PricePilot Inventory Monitor &bull; Automated Out-of-Stock Prevention
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

    const subject = `🔐 Reset Your PricePilot AI Password`;
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #060913; padding: 40px 16px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #0d1326; border-radius: 20px; border: 1px solid rgba(99, 102, 241, 0.25); overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);">
                            <tr>
                                <td height="5" style="background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);"></td>
                            </tr>
                            <tr>
                                <td style="padding: 36px 36px 20px 36px;">
                                    <div style="display: inline-block; padding: 5px 12px; border-radius: 20px; background: rgba(99, 102, 241, 0.14); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 14px;">
                                        Security Verification
                                    </div>
                                    <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                                        Reset Your Password
                                    </h1>
                                    <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                                        We received a request to reset the password associated with <strong style="color: #f1f5f9;">${email}</strong>. Click below to choose a new password:
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding: 10px 36px 30px 36px;">
                                    <table cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); box-shadow: 0 10px 20px -3px rgba(99, 102, 241, 0.4);">
                                                <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 12px;">
                                                    Set New Password &rarr;
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin: 22px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                                        This reset link is valid for <strong>1 hour</strong>. If you did not request this change, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #070b16; padding: 20px 36px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                                    <p style="margin: 0; font-size: 12px; color: #475569;">
                                        PricePilot AI &bull; Autonomous Pricing Defense
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

    return _sendMail(email, subject, html);
};

/**
 * Send generic notification email (e.g. feedback/report alerts)
 */
exports.sendNotificationEmail = async (subject, htmlContent, recipient = null) => {
    const fromEmail = (process.env.BREVO_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'notifications@pricepilot.ai').trim();
    const to = recipient || process.env.ADMIN_NOTIFICATION_EMAIL || fromEmail;
    return _sendMail(to, subject, htmlContent);
};

/**
 * Test email dispatcher for Brevo diagnostics
 */
exports.sendTestEmail = async (targetEmail) => {
    const subject = `🧪 PricePilot AI Brevo Delivery Test (${new Date().toLocaleTimeString()})`;
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Brevo Email Delivery Test</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #060913; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #060913; padding: 40px 16px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #0d1326; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.35); overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);">
                            <tr>
                                <td height="5" style="background: linear-gradient(90deg, #10b981 0%, #06b6d4 100%);"></td>
                            </tr>
                            <tr>
                                <td style="padding: 32px 32px 24px 32px; text-align: center;">
                                    <div style="font-size: 38px; margin-bottom: 12px;">✅</div>
                                    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #ffffff;">
                                        Brevo Email Delivery Active!
                                    </h1>
                                    <p style="margin: 0 0 16px 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                                        Your PricePilot AI transactional email pipeline is operating normally via Brevo's REST API (300 free emails/day).
                                    </p>
                                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 12px; font-size: 12px; color: #34d399; font-weight: 600;">
                                        Timestamp: ${new Date().toISOString()}
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
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
