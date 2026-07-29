const sgMail = require('@sendgrid/mail');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'notifications@pricepilot.ai';

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Send email alert when product stock falls to or below reorder threshold
 */
exports.sendLowStockAlert = async (user, product) => {
    if (!user?.email || !product) return;

    const subject = `⚠️ Low Stock Alert: ${product.name} (${product.sku})`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0a0f1e; color: #f1f5f9;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #6366f1; margin: 0;">PricePilot AI Intelligence</h2>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase;">Inventory Alert</p>
            </div>
            <div style="background-color: #131b2e; padding: 20px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
                <h3 style="color: #ef4444; margin-top: 0;">Stock Reorder Threshold Reached</h3>
                <p>Hello <strong>${user.name || 'Merchant'}</strong>,</p>
                <p>Your product <strong>${product.name}</strong> (SKU: <code>${product.sku}</code>) has dropped to critical stock levels:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0; color: #f8fafc;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #1e293b;">Current Stock:</td><td style="padding: 8px; border-bottom: 1px solid #1e293b; color: #ef4444; font-weight: bold;">${product.stockLevel} units</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #1e293b;">Reorder Threshold:</td><td style="padding: 8px; border-bottom: 1px solid #1e293b;">${product.reorderThreshold} units</td></tr>
                    <tr><td style="padding: 8px;">Current Price:</td><td style="padding: 8px; font-weight: bold; color: #6366f1;">₹${product.currentPrice}</td></tr>
                </table>
                <p>Please reorder stock soon to prevent stockout loss.</p>
            </div>
        </div>
    `;

    await _sendMail(user.email, subject, html);
};

/**
 * Send email alert when a new AI price recommendation is generated
 */
exports.sendNewRecommendationAlert = async (user, product, recommendation) => {
    if (!user?.email || !product || !recommendation) return;

    const diff = recommendation.recommendedPrice - product.currentPrice;
    const diffText = diff > 0 ? `+₹${diff} (+${recommendation.expectedRevenueImpact}%)` : `-₹${Math.abs(diff)} (${recommendation.expectedRevenueImpact}%)`;

    const subject = `💡 New AI Price Recommendation for ${product.name}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0a0f1e; color: #f1f5f9;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #6366f1; margin: 0;">PricePilot AI Intelligence</h2>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase;">Pricing Recommendation</p>
            </div>
            <div style="background-color: #131b2e; padding: 20px; border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.3);">
                <h3 style="color: #6366f1; margin-top: 0;">New Optimal Price Suggested</h3>
                <p>Hello <strong>${user.name || 'Merchant'}</strong>,</p>
                <p>Gemini AI has analyzed competitor market movements and generated a new price recommendation for <strong>${product.name}</strong>:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0; color: #f8fafc;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #1e293b;">Current Price:</td><td style="padding: 8px; border-bottom: 1px solid #1e293b;">₹${product.currentPrice}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #1e293b;">Recommended Price:</td><td style="padding: 8px; border-bottom: 1px solid #1e293b; color: #10b981; font-weight: bold;">₹${recommendation.recommendedPrice} (${diffText})</td></tr>
                    <tr><td style="padding: 8px;">Confidence Score:</td><td style="padding: 8px; color: #f59e0b;">${Math.round((recommendation.confidenceScore || 0.85) * 100)}%</td></tr>
                </table>
                <p><strong>Rationale:</strong> ${recommendation.reason}</p>
            </div>
        </div>
    `;

    await _sendMail(user.email, subject, html);
};

async function _sendMail(to, subject, html) {
    if (!SENDGRID_API_KEY) {
        console.log(`[EmailService Debug] SENDGRID_API_KEY not configured. Email suppressed: "${subject}" to ${to}`);
        return;
    }
    try {
        await sgMail.send({
            to,
            from: FROM_EMAIL,
            subject,
            html,
        });
        console.log(`[EmailService] Sent email "${subject}" to ${to}`);
    } catch (err) {
        console.error('[EmailService Error] Failed to send email:', err.message);
    }
}
