const AdminAuditLog = require("../models/AdminAuditLog");

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "";
};

const logAdminAction = async (req, { action, targetType, targetId = "", meta = {} }) => {
  await AdminAuditLog.create({
    actor: req.user._id,
    action,
    targetType,
    targetId: String(targetId || ""),
    requestId: req.requestId || "",
    ipAddress: getClientIp(req),
    userAgent: String(req.headers["user-agent"] || "").slice(0, 512),
    meta
  });
};

module.exports = {
  logAdminAction
};