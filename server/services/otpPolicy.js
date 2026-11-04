const isOtpExpired = (expiresAt, now = new Date()) => expiresAt.getTime() <= now.getTime();

const canAttemptOtp = (attempts, maxAttempts) => attempts < maxAttempts;

const canResendOtp = ({
  lastSentAt,
  resendWindowStartedAt,
  resendCount,
  cooldownSeconds,
  maxRetriesPerHour,
  now = new Date()
}) => {
  const sinceLastSentSeconds = Math.floor((now.getTime() - lastSentAt.getTime()) / 1000);
  if (sinceLastSentSeconds < cooldownSeconds) {
    return {
      allowed: false,
      reason: "cooldown",
      retryAfterSeconds: cooldownSeconds - sinceLastSentSeconds
    };
  }

  const hourAgeMs = now.getTime() - resendWindowStartedAt.getTime();
  if (hourAgeMs <= 60 * 60 * 1000 && resendCount >= maxRetriesPerHour) {
    return {
      allowed: false,
      reason: "hourly_limit",
      retryAfterSeconds: 0
    };
  }

  return {
    allowed: true,
    reason: "ok",
    retryAfterSeconds: 0
  };
};

module.exports = {
  isOtpExpired,
  canAttemptOtp,
  canResendOtp
};