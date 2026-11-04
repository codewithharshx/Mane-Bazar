import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { Queue, Worker, Job } from "bullmq";
import { Redis } from "ioredis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EMAIL_QUEUE_NAME = "emails";

// Template directory points to apps/backend/src/templates/email (with dist fallback)
const distTemplateDir = path.join(__dirname, "..", "..", "templates", "email");
const srcTemplateDir = path.join(__dirname, "..", "..", "..", "src", "templates", "email");
const TEMPLATE_DIR = fs.existsSync(distTemplateDir) ? distTemplateDir : srcTemplateDir;

let transporter: nodemailer.Transporter | null = null;
let queue: Queue | null = null;
let worker: Worker | null = null;
let queueConnection: Redis | null = null;
let workerConnection: Redis | null = null;

const templateCache: Record<string, string> = {};

const getClientBaseUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const getEmailConfig = () => ({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || "",
  port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 0),
  user: process.env.EMAIL_USER || process.env.SMTP_USER || "",
  pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || "",
  from: process.env.EMAIL_FROM || process.env.MAIL_FROM || process.env.SMTP_USER || "manebazarr@gmail.com",
});

const hasTransportConfig = (): boolean => {
  const config = getEmailConfig();
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
};

const hasRedisConfig = (): boolean =>
  Boolean(process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_PORT));

const getRedisConnection = (): Redis => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

const getTransporter = (): nodemailer.Transporter | null => {
  if (!hasTransportConfig()) return null;

  if (!transporter) {
    const config = getEmailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
  }

  return transporter;
};

const readTemplate = (templateName: string): string => {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  const filePath = path.join(TEMPLATE_DIR, `${templateName}.html`);
  const content = fs.readFileSync(filePath, "utf8");
  templateCache[templateName] = content;
  return content;
};

const renderTemplate = (template: string, variables: Record<string, any>): string =>
  template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key) => String(variables[key] ?? ""));

const htmlToText = (html: string): string =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const normalizeEmailError = (error: any): any => {
  if (!error) {
    const fallback: any = new Error("Unable to send email right now. Please try again later.");
    fallback.statusCode = 503;
    return fallback;
  }

  if (error.code === "EAUTH" || error.responseCode === 535) {
    const sanitized: any = new Error("Email service is temporarily unavailable. Please try again later.");
    sanitized.statusCode = 503;
    return sanitized;
  }

  return error;
};

interface EmailPayload {
  to: string;
  subject: string;
  templateName: string;
  variables: Record<string, any>;
}

const sendEmailNow = async ({ to, subject, templateName, variables }: EmailPayload): Promise<void> => {
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
      html,
    });
  } catch (error) {
    const normalizedError = normalizeEmailError(error);

    if (process.env.NODE_ENV !== "production" && normalizedError.statusCode === 503) {
      console.warn(
        `[dev-email-fallback] to=${to} subject="${subject}" reason=${normalizedError.message} body=${text.slice(0, 120)}...`,
      );
      return;
    }

    throw normalizedError;
  }
};

const enqueueEmail = async (payload: EmailPayload): Promise<void> => {
  if (queue) {
    await queue.add("send", payload, {
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
    return;
  }

  await sendEmailNow(payload);
};

export const initEmailService = async (): Promise<void> => {
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
    async (job: Job) => {
      await sendEmailNow(job.data);
    },
    { connection: workerConnection },
  );

  worker.on("failed", (job: Job | undefined, error: Error) => {
    console.error(`[email-worker] job ${job?.id || "unknown"} failed:`, error.message);
  });
};

export const shutdownEmailService = async (): Promise<void> => {
  await Promise.all([
    worker ? worker.close() : Promise.resolve(),
    queue ? queue.close() : Promise.resolve(),
    workerConnection ? workerConnection.quit() : Promise.resolve(),
    queueConnection ? queueConnection.quit() : Promise.resolve(),
  ]);
};

interface QueueVerificationEmailOptions {
  to: string;
  name: string;
  otp: string;
  expiresMinutes: number;
}

export const queueVerificationOtpEmail = async ({ to, name, otp, expiresMinutes }: QueueVerificationEmailOptions): Promise<void> =>
  enqueueEmail({
    to,
    subject: "Verify your email",
    templateName: "verifyEmail",
    variables: { name, otp, expiresMinutes },
  });

interface QueuePasswordResetEmailOptions {
  to: string;
  name: string;
  resetToken: string;
  expiresMinutes: number;
}

export const queuePasswordResetEmail = async ({ to, name, resetToken, expiresMinutes }: QueuePasswordResetEmailOptions): Promise<void> =>
  enqueueEmail({
    to,
    subject: "Reset your password",
    templateName: "resetPassword",
    variables: {
      name,
      resetUrl: `${getClientBaseUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`,
      expiresMinutes,
    },
  });

interface QueueOrderConfirmationEmailOptions {
  to: string;
  name: string;
  orderId: string;
  orderTotal: number | string;
}

export const queueOrderConfirmationEmail = async ({ to, name, orderId, orderTotal }: QueueOrderConfirmationEmailOptions): Promise<void> =>
  enqueueEmail({
    to,
    subject: `Order confirmed: ${orderId}`,
    templateName: "orderConfirmation",
    variables: { name, orderId, orderTotal },
  });

interface QueuePlacementNotificationEmailOptions {
  to: string;
  name: string;
  orderId: string;
  status: string;
}

export const queuePlacementNotificationEmail = async ({ to, name, orderId, status }: QueuePlacementNotificationEmailOptions): Promise<void> =>
  enqueueEmail({
    to,
    subject: `Order update: ${orderId}`,
    templateName: "placementNotification",
    variables: { name, orderId, status },
  });
