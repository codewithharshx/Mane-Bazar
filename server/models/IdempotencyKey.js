const mongoose = require("mongoose");

const idempotencyKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    scope: {
      type: String,
      required: true,
      trim: true
    },
    key: {
      type: String,
      required: true,
      trim: true
    },
    requestHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing"
    },
    responseCode: {
      type: Number,
      default: 0
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    errorMessage: {
      type: String,
      default: ""
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

idempotencyKeySchema.index({ user: 1, scope: 1, key: 1 }, { unique: true });
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("IdempotencyKey", idempotencyKeySchema);