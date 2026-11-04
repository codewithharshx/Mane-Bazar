const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");

const EMAIL_QUEUE_NAME = "emails";
const TEMPLATE_DIR = path.join(__dirname, "..", "templates", "email");

let transporter = null;
let queue = null;
let worker = null;
let queueConnection = null;
let workerConnection = null;

// Template cache — read each file once, serve from memory thereafter
const templateCache = {};

const getClientBaseUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const getEmailConfig = () => ({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || "",
  port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 0),
  user: process.env.EMAIL_USER || process.env.SMTP_USER || "",
  pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || "",
  from: process.env.EMAIL_FROM || process.env.MAIL_FROM || process.env.SMTP_USER || "manebazarr@gmail.com"
});

const hasTransportConfig = () => {
  const config = getEmailConfig();
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
};

const hasRedisConfig = () =>
  Boolean(process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_PORT));

const getRedisConnection = () => {
  if (process.env.REDIS_URL) {
    return new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });
  }

  return new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
};

const getTransporter = () => {
  if (!hasTransportConfig()) return null;

  if (!transporter) {
    const config = getEmailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass }
    });
  }

  return transporter;
};

/**
 * Read and cache email template HTML.
 * First call reads from disk; subsequent calls serve from memory.
 */
const readTemplate = (templateName) => {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  const filePath = path.join(TEMPLATE_DIR, `${templateName}.html`);
  const content = fs.readFileSync(filePath, "utf8");
  templateCache[templateName] = content;
  return content;
};

const renderTemplate = (template, variables) =>
  template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => String(variables[key] ?? ""));

const htmlToText = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const normalizeEmailError = (error) => {
  if (!error) {
    const fallback = new Error("Unable to send email right now. Please try again later.");
    fallback.statusCode = 503;
    return fallback;
  }

  if (error.code === "EAUTH" || error.responseCode === 535) {
    const sanitized = new Error("Email service is temporarily unavailable. Please try again later.");
    sanitized.statusCode = 503;
    return sanitized;
  }

  return error;
};

const sendEmailNow = async ({ to, subject, templateName, variables }) => {
  const transport = getTransporter();
  const htmlTemplate = readTemplate(templateName);
  const html = renderTemplate(htmlTemplate, variables);
  const text = htmlToText(html);

  if (!transport) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email transport is not configured in production");
    }

    console.log(`[dev-email] to=${to} subject="${subject}" body=${text.slice(0, 120)}...`);
    return;
  }

  try {
    await transport.sendMail({
      from: getEmailConfig().from,
      to,
      subject,
      text,
      html
    });
  } catch (error) {
    const normalizedError = normalizeEmailError(error);

    if (process.env.NODE_ENV !== "production" && normalizedError.statusCode === 503) {
      console.warn(
        `[dev-email-fallback] to=${to} subject="${subject}" reason=${normalizedError.message} body=${text.slice(0, 120)}...`
      );
      return;
    }

    throw normalizedError;
  }
};

const enqueueEmail = async (payload) => {
  if (queue) {
    await queue.add("send", payload, {
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 200
    });
    return;
  }

  await sendEmailNow(payload);
};

const initEmailService = async () => {
  if (!hasRedisConfig()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Redis configuration is required in production for email queue");
    }
    return;
  }

  queueConnection = getRedisConnection();
  workerConnection = getRedisConnection();

  queue = new Queue(EMAIL_QUEUE_NAME, { connection: queueConnection });
  worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job) => {
      await sendEmailNow(job.data);
    },
    { connection: workerConnection }
  );

  worker.on("failed", (job, error) => {
    console.error(`[email-worker] job ${job?.id || "unknown"} failed:`, error.message);
  });
};

const shutdownEmailService = async () => {
  await Promise.all([
    worker ? worker.close() : Promise.resolve(),
    queue ? queue.close() : Promise.resolve(),
    workerConnection ? workerConnection.quit() : Promise.resolve(),
    queueConnection ? queueConnection.quit() : Promise.resolve()
  ]);
};

// ─── Queue helpers ─────────────────────────────────────────────────────────

const queueVerificationOtpEmail = async ({ to, name, otp, expiresMinutes }) =>
  enqueueEmail({
    to,
    subject: "Verify your email",
    templateName: "verifyEmail",
    variables: { name, otp, expiresMinutes }
  });

const queuePasswordResetEmail = async ({ to, name, resetToken, expiresMinutes }) =>
  enqueueEmail({
    to,
    subject: "Reset your password",
    templateName: "resetPassword",
    variables: {
      name,
      resetUrl: `${getClientBaseUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`,
      expiresMinutes
    }
  });

const queueOrderConfirmationEmail = async ({ to, name, orderId, orderTotal }) =>
  enqueueEmail({
    to,
    subject: `Order confirmed: ${orderId}`,
    templateName: "orderConfirmation",
    variables: { name, orderId, orderTotal }
  });

const queuePlacementNotificationEmail = async ({ to, name, orderId, status }) =>
  enqueueEmail({
    to,
    subject: `Order update: ${orderId}`,
    templateName: "placementNotification",
    variables: { name, orderId, status }
  });

module.exports = {
  initEmailService,
  shutdownEmailService,
  queueVerificationOtpEmail,
  queuePasswordResetEmail,
  queueOrderConfirmationEmail,
  queuePlacementNotificationEmail,
  __private__: { renderTemplate, htmlToText }
};
