const { Resend } = require("resend");

const { getPublicAppUrl } = require("./app-url");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.EMAIL_FROM || "NovaShop <noreply@novashop.co.in>";
const APP_NAME = process.env.APP_NAME || "NovaShop";
const CLIENT_URL = getPublicAppUrl();

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn(`[Email] Skipped (no RESEND_API_KEY): ${subject} → ${to}`);
    return null;
  }
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
  if (error) {
    console.error("[Email] Send failed:", error);
    throw new Error("Failed to send email");
  }
  return data;
}

// ── Templates ────────────────────────────────────────────────────────────────

function baseTemplate(content) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0;">${APP_NAME}</h1>
      </div>
      ${content}
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #888; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      </div>
    </div>
  `;
}

async function sendWelcomeEmail(to, userName) {
  return sendEmail({
    to,
    subject: `Welcome to ${APP_NAME}!`,
    html: baseTemplate(`
      <h2 style="font-size: 20px; margin-bottom: 16px;">Welcome, ${userName}! 🎉</h2>
      <p style="line-height: 1.6;">Your account has been created successfully. Start exploring our curated collection of products from top brands.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${CLIENT_URL}/shop/home" style="background: #000; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start Shopping</a>
      </div>
    `),
  });
}

async function sendPasswordResetEmail(to, userName, resetToken) {
  const resetUrl = `${CLIENT_URL}/auth/reset-password?token=${resetToken}`;
  return sendEmail({
    to,
    subject: `Reset your ${APP_NAME} password`,
    html: baseTemplate(`
      <h2 style="font-size: 20px; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="line-height: 1.6;">Hi ${userName}, we received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background: #000; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
      </div>
      <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    `),
  });
}

async function sendEmailVerificationEmail(to, userName, verificationToken) {
  const verifyUrl = `${CLIENT_URL}/auth/verify-email?token=${verificationToken}`;
  return sendEmail({
    to,
    subject: `Verify your ${APP_NAME} email`,
    html: baseTemplate(`
      <h2 style="font-size: 20px; margin-bottom: 16px;">Verify your email</h2>
      <p style="line-height: 1.6;">Hi ${userName}, please confirm your email address to activate your account.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="background: #000; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify Email</a>
      </div>
      <p style="color: #888; font-size: 13px;">This link expires in 24 hours.</p>
    `),
  });
}

async function sendOrderConfirmationEmail(to, userName, order) {
  const itemsHtml = order.cartItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
          <strong>${item.title}</strong><br/>
          <span style="color: #888;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  return sendEmail({
    to,
    subject: `Order Confirmed — #${String(order._id).slice(-8).toUpperCase()}`,
    html: baseTemplate(`
      <h2 style="font-size: 20px; margin-bottom: 16px;">Order Confirmed! ✅</h2>
      <p style="line-height: 1.6;">Hi ${userName}, your order has been placed successfully.</p>
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 4px;"><strong>Order ID:</strong> #${String(order._id).slice(-8).toUpperCase()}</p>
        <p style="margin: 0;"><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Item</th>
            <th style="text-align: right; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td style="padding-top: 12px; font-weight: 700; font-size: 16px;">Total</td>
            <td style="padding-top: 12px; font-weight: 700; font-size: 16px; text-align: right;">$${order.totalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${CLIENT_URL}/shop/account" style="background: #000; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Order</a>
      </div>
    `),
  });
}

async function sendShippingEmail(to, userName, order) {
  const tracking = order.shipping || {};
  return sendEmail({
    to,
    subject: `Your order has shipped — #${String(order._id).slice(-8).toUpperCase()}`,
    html: baseTemplate(`
      <h2 style="font-size: 20px; margin-bottom: 16px;">Your Order Has Shipped! 📦</h2>
      <p style="line-height: 1.6;">Hi ${userName}, great news — your order is on its way!</p>
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 4px;"><strong>Carrier:</strong> ${tracking.carrier || "Standard Shipping"}</p>
        <p style="margin: 0 0 4px;"><strong>Tracking #:</strong> ${tracking.trackingNumber || "N/A"}</p>
        <p style="margin: 0;"><strong>Est. Delivery:</strong> ${tracking.estimatedDelivery ? new Date(tracking.estimatedDelivery).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "3–5 business days"}</p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${CLIENT_URL}/shop/account" style="background: #000; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Track Order</a>
      </div>
    `),
  });
}

function formatPickupWindow(returnShipping) {
  if (!returnShipping?.pickupScheduledAt) return "We'll contact you shortly";
  const date = new Date(returnShipping.pickupScheduledAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return `${date}, 10:00 AM – 2:00 PM`;
}

async function sendRefundInitiatedEmail(to, userName, order, refundRecord, returnShipping) {
  const shortId = String(order._id).slice(-8).toUpperCase();
  return sendEmail({
    to,
    subject: `Return initiated for order #${shortId} — pickup scheduled`,
    html: baseTemplate(`
      <h2 style="font-size: 20px; margin-bottom: 16px;">Return Initiated</h2>
      <p style="line-height: 1.6;">Hi ${userName}, your refund request was approved. We've scheduled a return pickup.</p>
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 4px;"><strong>Item:</strong> ${refundRecord.itemTitle || "Order item"}</p>
        <p style="margin: 0 0 4px;"><strong>Refund amount:</strong> $${Number(refundRecord.amount || 0).toFixed(2)}</p>
        <p style="margin: 0 0 4px;"><strong>Pickup window:</strong> ${formatPickupWindow(returnShipping)}</p>
        <p style="margin: 0 0 4px;"><strong>Agent:</strong> ${returnShipping.agentName || "NovaShop Returns"} · ${returnShipping.agentPhone || ""}</p>
        <p style="margin: 0;"><strong>Return tracking:</strong> ${returnShipping.trackingNumber || "Pending"}</p>
      </div>
      <p style="line-height: 1.6; color: #555;">Keep the item in original packaging. The agent will call ~30 minutes before arrival.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${CLIENT_URL}/shop/account" style="background: #000; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Return Details</a>
      </div>
    `),
  });
}

const RETURN_STATUS_EMAIL_SUBJECTS = {
  PICKED_UP: "Your return item has been picked up",
  RECEIVED: "We received your return",
  REFUND_COMPLETED: "Your refund is complete",
};

async function sendReturnStatusUpdateEmail(to, userName, order, newStatus, latestEvent) {
  const subject =
    RETURN_STATUS_EMAIL_SUBJECTS[newStatus] ||
    `Return update for order #${String(order._id).slice(-8).toUpperCase()}`;
  const shortId = String(order._id).slice(-8).toUpperCase();

  return sendEmail({
    to,
    subject: `${subject} — #${shortId}`,
    html: baseTemplate(`
      <h2 style="font-size: 20px; margin-bottom: 16px;">Return Update</h2>
      <p style="line-height: 1.6;">Hi ${userName}, here's an update on your return for order #${shortId}.</p>
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 4px;"><strong>Status:</strong> ${newStatus.replace(/_/g, " ")}</p>
        <p style="margin: 0;">${latestEvent?.description || "Your return is progressing."}</p>
        ${returnShippingTracking(order)}
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${CLIENT_URL}/shop/account" style="background: #000; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Order</a>
      </div>
    `),
  });
}

function returnShippingTracking(order) {
  const tracking = order.returnShipping?.trackingNumber;
  if (!tracking) return "";
  return `<p style="margin: 8px 0 0;"><strong>Tracking:</strong> ${tracking}</p>`;
}

module.exports = {
  sendEmail,
  sendEmailVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendShippingEmail,
  sendRefundInitiatedEmail,
  sendReturnStatusUpdateEmail,
};
