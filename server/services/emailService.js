const sgMail = require('@sendgrid/mail');
let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    // optional fallback
}

const SENDGRID_API_KEY = (process.env.SENDGRID_API_KEY || '').trim();
const FROM_EMAIL = (process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'notifications@pricepilot.ai').trim();
const CLIENT_URL = (process.env.CLIENT_URL || 'https://price-pilot-ai-369.vercel.app').trim();

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

// Setup Nodemailer SMTP transport if SMTP credentials are provided
let smtpTransporter = null;
if (nodemailer && (process.env.SMTP_HOST || process.env.SMTP_USER || process.env.GMAIL_USER)) {
    try {
        if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
            smtpTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PASS,
                }
            });
        } else if (process.env.SMTP_HOST) {
            smtpTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT, 10) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                }
            });
        }
        console.log('[EmailService] SMTP transporter initialized.');
    } catch (err) {
        console.warn('[EmailService Warning] Failed to initialize SMTP transporter:', err.message);
    }
}

/**
 * Send welcome onboarding email when a new user registers
 */
exports.sendWelcomeEmail = async (user) => {
    if (!user?.email) return;

    const userName = user.name || 'Merchant';
    const subject = `Welcome to PricePilot AI — Powering Your Autonomous Dynamic Pricing`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to PricePilot AI</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #070a14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070a14; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0d1326; border-radius: 16px; border: 1px solid rgba(99, 102, 241, 0.2); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
                            <!-- Header Banner -->
                            <tr>
                                <td style="padding: 36px 32px 24px; text-align: center; background: linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(13, 19, 38, 0) 100%); border-bottom: 1px solid rgba(99, 102, 241, 0.1);">
                                    <div style="display: inline-block; padding: 6px 14px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 20px; color: #818cf8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                                        Autonomous Pricing Intelligence
                                    </div>
                                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Welcome to PricePilot AI</h1>
                                    <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Your high-frequency pricing & inventory intelligence command center</p>
                                </td>
                            </tr>
                            
                            <!-- Body Content -->
                            <tr>
                                <td style="padding: 32px;">
                                    <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-top: 0;">Hello <strong style="color: #ffffff;">${userName}</strong>,</p>
                                    <p style="font-size: 15px; line-height: 1.6; color: #94a3b8;">
                                        Thank you for joining PricePilot AI! Your merchant account is ready. With machine learning elasticity forecasting and real-time competitor tracking, PricePilot AI automatically protects your margins and optimizes catalog revenue.
                                    </p>

                                    <!-- Feature Grid -->
                                    <div style="margin: 28px 0; background-color: #131b2e; border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 12px; padding: 20px;">
                                        <h3 style="margin: 0 0 14px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #818cf8;">Quick Start Capabilities:</h3>
                                        <table width="100%" cellpadding="6" cellspacing="0">
                                            <tr>
                                                <td width="28" valign="top" style="color: #10b981; font-size: 16px;">✓</td>
                                                <td style="font-size: 14px; color: #cbd5e1;"><strong style="color: #ffffff;">AI What-If Simulator:</strong> Test price elasticities and scenario impacts before pushing to store.</td>
                                            </tr>
                                            <tr>
                                                <td width="28" valign="top" style="color: #10b981; font-size: 16px;">✓</td>
                                                <td style="font-size: 14px; color: #cbd5e1;"><strong style="color: #ffffff;">Explainable Recommendations:</strong> Understand exact algorithmic rationales and confidence scores.</td>
                                            </tr>
                                            <tr>
                                                <td width="28" valign="top" style="color: #10b981; font-size: 16px;">✓</td>
                                                <td style="font-size: 14px; color: #cbd5e1;"><strong style="color: #ffffff;">Competitor Undercut Defense:</strong> Real-time scrapers detect price drops and automatically trigger alerts.</td>
                                            </tr>
                                            <tr>
                                                <td width="28" valign="top" style="color: #10b981; font-size: 16px;">✓</td>
                                                <td style="font-size: 14px; color: #cbd5e1;"><strong style="color: #ffffff;">Multi-Channel Sync:</strong> Direct connectors for Shopify, WooCommerce, and custom CSV imports.</td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 32px 0 16px;">
                                        <a href="${CLIENT_URL}/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                                            Launch Your Dashboard →
                                        </a>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 24px 32px; background-color: #080c1a; border-top: 1px solid rgba(99, 102, 241, 0.08); text-align: center;">
                                    <p style="font-size: 12px; color: #64748b; margin: 0;">
                                        Need assistance? Explore our <a href="${CLIENT_URL}/docs" style="color: #818cf8; text-decoration: none;">Interactive Documentation</a> or contact support anytime.
                                    </p>
                                    <p style="font-size: 11px; color: #475569; margin: 8px 0 0;">
                                        © ${new Date().getFullYear()} PricePilot AI Platform. All rights reserved.
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

    await _sendMail(user.email, subject, html);
};

/**
 * Send email alert when product stock falls to or below reorder threshold
 */
exports.sendLowStockAlert = async (user, product) => {
    if (!user?.email || !product) return;

    const threshold = product.reorderThreshold !== undefined ? product.reorderThreshold : 10;
    const isCritical = product.stockLevel === 0;
    const subject = `⚠️ [${isCritical ? 'CRITICAL STOCKOUT' : 'Low Stock Alert'}]: ${product.name} (SKU: ${product.sku || 'N/A'})`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 20px; background-color: #070a14; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #f1f5f9;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #0d1326; border-radius: 12px; border: 1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                    <div style="padding: 4px 10px; background: ${isCritical ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}; border-radius: 6px; color: ${isCritical ? '#ef4444' : '#f59e0b'}; font-weight: bold; font-size: 12px; text-transform: uppercase;">
                        ${isCritical ? 'Critical Stockout' : 'Low Stock Warning'}
                    </div>
                </div>
                <h2 style="color: #ffffff; margin: 0 0 8px; font-size: 20px;">Inventory Action Required</h2>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Hello ${user.name || 'Merchant'}, product <strong>${product.name}</strong> is at risk of stockout.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #131b2e; border-radius: 8px; overflow: hidden;">
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">SKU:</td><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-family: monospace;">${product.sku || 'N/A'}</td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Current Stock:</td><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: ${isCritical ? '#ef4444' : '#f59e0b'}; font-weight: bold; font-size: 16px;">${product.stockLevel} units</td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Reorder Threshold:</td><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #f8fafc;">${threshold} units</td></tr>
                    <tr><td style="padding: 12px 16px; color: #94a3b8;">Current Price:</td><td style="padding: 12px 16px; color: #818cf8; font-weight: bold;">₹${product.currentPrice}</td></tr>
                </table>

                <div style="text-align: center; margin-top: 24px;">
                    <a href="${CLIENT_URL}/dashboard/products" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 6px; font-size: 14px;">
                        Manage Inventory in Dashboard →
                    </a>
                </div>
            </div>
        </body>
        </html>
    `;

    await _sendMail(user.email, subject, html);
};

/**
 * Send email alert when a new AI price recommendation is generated
 */
exports.sendNewRecommendationAlert = async (user, product, recommendation) => {
    if (!user?.email || !product || !recommendation) return;

    const diff = recommendation.recommendedPrice - product.currentPrice;
    const diffText = diff > 0 ? `+₹${diff} (+${recommendation.expectedRevenueImpact || 0}%)` : `-₹${Math.abs(diff)} (${recommendation.expectedRevenueImpact || 0}%)`;

    const subject = `💡 New AI Price Recommendation for ${product.name}`;
    const html = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 20px; background-color: #070a14; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #f1f5f9;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #0d1326; border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.3); padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="padding: 4px 10px; background: rgba(99, 102, 241, 0.2); border-radius: 6px; color: #818cf8; font-weight: bold; font-size: 12px; display: inline-block; margin-bottom: 12px; text-transform: uppercase;">
                    AI Pricing Opportunity
                </div>
                <h2 style="color: #ffffff; margin: 0 0 8px; font-size: 20px;">Optimal Price Opportunity Detected</h2>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Gemini AI evaluated market elasticity and competitor signals for <strong>${product.name}</strong>:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #131b2e; border-radius: 8px; overflow: hidden;">
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Current Price:</td><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #f8fafc;">₹${product.currentPrice}</td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Recommended Price:</td><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #10b981; font-weight: bold; font-size: 16px;">₹${recommendation.recommendedPrice} (${diffText})</td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8;">Confidence Score:</td><td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #f59e0b;">${Math.round((recommendation.confidenceScore || 0.85) * 100)}%</td></tr>
                    <tr><td style="padding: 12px 16px; color: #94a3b8;">Algorithmic Rationale:</td><td style="padding: 12px 16px; color: #cbd5e1; font-size: 13px;">${recommendation.reason || 'Elasticity and competitor positioning optimization.'}</td></tr>
                </table>

                <div style="text-align: center; margin-top: 24px;">
                    <a href="${CLIENT_URL}/dashboard/recommendations" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 6px; font-size: 14px;">
                        Review & Apply in Dashboard →
                    </a>
                </div>
            </div>
        </body>
        </html>
    `;

    await _sendMail(user.email, subject, html);
};

/**
 * Send admin or system notification email
 */
exports.sendNotificationEmail = async (subject, html, recipient = null) => {
    const to = recipient || process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || FROM_EMAIL;
    await _sendMail(to, subject, html);
};

/**
 * Core dispatch function handling SendGrid, Nodemailer SMTP, and dev logger
 */
async function _sendMail(to, subject, html) {
    if (!to) return;

    // 1. Try SendGrid
    if (SENDGRID_API_KEY) {
        try {
            await sgMail.send({
                to,
                from: FROM_EMAIL,
                subject,
                html,
            });
            console.log(`[EmailService/SendGrid] Sent email "${subject}" to ${to}`);
            return { success: true, provider: 'sendgrid' };
        } catch (err) {
            console.error('[EmailService/SendGrid Error]', err.message, err.response?.body?.errors ? JSON.stringify(err.response.body.errors) : '');
        }
    }

    // 2. Try SMTP Nodemailer
    if (smtpTransporter) {
        try {
            await smtpTransporter.sendMail({
                from: FROM_EMAIL,
                to,
                subject,
                html,
            });
            console.log(`[EmailService/SMTP] Sent email "${subject}" to ${to}`);
            return { success: true, provider: 'smtp' };
        } catch (err) {
            console.error('[EmailService/SMTP Error]', err.message);
        }
    }

    // 3. Fallback dev logger
    console.log(`[EmailService/DevLog] Email prepared for <${to}>: "${subject}" (configured providers: SendGrid=${Boolean(SENDGRID_API_KEY)}, SMTP=${Boolean(smtpTransporter)})`);
    return { success: false, reason: 'no_active_provider' };
}
