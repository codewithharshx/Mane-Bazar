const crypto = require("crypto");

const OTP_LENGTH = 6;

const generateOTP = () => {
  const value = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return String(value).padStart(OTP_LENGTH, "0");
};

module.exports = {
  OTP_LENGTH,
  generateOTP
};
