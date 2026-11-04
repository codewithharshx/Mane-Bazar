import crypto from "crypto";

export const OTP_LENGTH = 6;

export const generateOTP = (): string => {
  const value = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return String(value).padStart(OTP_LENGTH, "0");
};
