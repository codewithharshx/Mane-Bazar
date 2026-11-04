export const isOtpExpired = (expiresAt: Date, now: Date = new Date()): boolean =>
  expiresAt.getTime() <= now.getTime();

export const canAttemptOtp = (attempts: number, maxAttempts: number): boolean =>
  attempts < maxAttempts;

interface ResendOtpOptions {
  lastSentAt: Date;
  resendWindowStartedAt: Date;
  resendCount: number;
  cooldownSeconds: number;
  maxRetriesPerHour: number;
  now?: Date;
}

interface ResendOtpResult {
  allowed: boolean;
  reason: "cooldown" | "hourly_limit" | "ok";
  retryAfterSeconds: number;
}

export const canResendOtp = ({
  lastSentAt,
  resendWindowStartedAt,
  resendCount,
  cooldownSeconds,
  maxRetriesPerHour,
  now = new Date(),
}: ResendOtpOptions): ResendOtpResult => {
  const sinceLastSentSeconds = Math.floor((now.getTime() - lastSentAt.getTime()) / 1000);
  if (sinceLastSentSeconds < cooldownSeconds) {
    return {
      allowed: false,
      reason: "cooldown",
      retryAfterSeconds: cooldownSeconds - sinceLastSentSeconds,
    };
  }

  const hourAgeMs = now.getTime() - resendWindowStartedAt.getTime();
  if (hourAgeMs <= 60 * 60 * 1000 && resendCount >= maxRetriesPerHour) {
    return {
      allowed: false,
      reason: "hourly_limit",
      retryAfterSeconds: 0,
    };
  }

  return {
    allowed: true,
    reason: "ok",
    retryAfterSeconds: 0,
  };
};
