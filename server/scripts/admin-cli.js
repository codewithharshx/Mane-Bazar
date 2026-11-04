#!/usr/bin/env node

/**
 * Mane Bazar Admin Management CLI
 * 
 * Usage:
 *   npm run admin -- promote <email>
 *   npm run admin -- demote <email>
 *   npm run admin -- create <email> <password> <name>
 *   npm run admin -- reset-password <email> <password>
 *   npm run admin -- list
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const { connectDB } = require("../config/db");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m"
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

const args = process.argv.slice(2);
const command = args[0];

// ─── Promote User to Admin ─────────────────────────────────────────────────
const promoteToAdmin = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    log.error(`User with email ${email} not found`);
    process.exit(1);
  }
  
  if (user.role === "admin") {
    log.warn(`${email} is already an admin`);
    process.exit(0);
  }
  
  user.role = "admin";
  await user.save();
  log.success(`${email} has been promoted to admin`);
  process.exit(0);
};

// ─── Demote Admin to User ──────────────────────────────────────────────────
const demoteToUser = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    log.error(`User with email ${email} not found`);
    process.exit(1);
  }
  
  if (user.role === "user") {
    log.warn(`${email} is already a regular user`);
    process.exit(0);
  }
  
  user.role = "user";
  await user.save();
  log.success(`${email} has been demoted to regular user`);
  process.exit(0);
};

// ─── Create New Admin ──────────────────────────────────────────────────────
const createAdmin = async (email, password, name) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  
  if (existingUser) {
    log.error(`User with email ${email} already exists`);
    process.exit(1);
  }
  
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: "admin"
  });
  
  log.success(`Admin created successfully`);
  log.info(`Email: ${user.email}`);
  log.info(`Name: ${user.name}`);
  log.info(`ID: ${user._id}`);
  process.exit(0);
};

// ─── Reset User Password ──────────────────────────────────────────────────
const resetPassword = async (email, newPassword) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    log.error(`User with email ${email} not found`);
    process.exit(1);
  }
  
  user.password = newPassword;
  await user.save();
  
  log.success(`Password reset successfully for ${email}`);
  log.info(`New password: ${newPassword}`);
  process.exit(0);
};

// ─── List All Admins ──────────────────────────────────────────────────────
const listAdmins = async () => {
  const admins = await User.find({ role: "admin" }).select("name email createdAt");
  
  if (admins.length === 0) {
    log.warn("No admins found");
    process.exit(0);
  }
  
  log.info(`Found ${admins.length} admin(s):`);
  console.log();
  console.table(admins.map(admin => ({
    "Email": admin.email,
    "Name": admin.name,
    "Created": new Date(admin.createdAt).toLocaleDateString()
  })));
  
  process.exit(0);
};

// ─── List All Users ────────────────────────────────────────────────────────
const listUsers = async () => {
  const users = await User.find().select("name email role createdAt").sort("-createdAt");
  
  if (users.length === 0) {
    log.warn("No users found");
    process.exit(0);
  }
  
  log.info(`Found ${users.length} user(s):`);
  console.log();
  console.table(users.map(user => ({
    "Email": user.email,
    "Name": user.name,
    "Role": user.role,
    "Created": new Date(user.createdAt).toLocaleDateString()
  })));
  
  process.exit(0);
};

// ─── Show Help ─────────────────────────────────────────────────────────────
const showHelp = () => {
  console.log(`
${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}
${colors.blue}║        Mane Bazar Admin Management CLI                      ║${colors.reset}
${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}

${colors.yellow}Usage:${colors.reset}
  npm run admin -- <command> [args]

${colors.yellow}Commands:${colors.reset}
  promote <email>              Promote user to admin
  demote <email>               Demote admin to user
  create <email> <password> <name>
                               Create new admin account
  reset-password <email> <password>
                               Reset user password
  list-admins                  List all admin accounts
  list-users                   List all users
  help                         Show this help message

${colors.yellow}Examples:${colors.reset}
  npm run admin -- promote john@example.com
  npm run admin -- demote john@example.com
  npm run admin -- create admin@example.com SecurePass123 "Admin Name"
  npm run admin -- reset-password john@example.com NewPass123
  npm run admin -- list-admins
  npm run admin -- list-users

${colors.yellow}Notes:${colors.reset}
  - Passwords must be at least 6 characters
  - Passwords must contain at least one uppercase letter
  - Passwords must contain at least one lowercase letter
  - Passwords must contain at least one number
  - Email addresses are case-insensitive

  `);
  process.exit(0);
};

// ─── Main ──────────────────────────────────────────────────────────────────
const main = async () => {
  if (!command || command === "help" || command === "-h" || command === "--help") {
    showHelp();
  }

  try {
    await connectDB();

    switch (command) {
      case "promote":
        if (!args[1]) {
          log.error("Email is required. Usage: npm run admin -- promote <email>");
          process.exit(1);
        }
        await promoteToAdmin(args[1]);
        break;

      case "demote":
        if (!args[1]) {
          log.error("Email is required. Usage: npm run admin -- demote <email>");
          process.exit(1);
        }
        await demoteToUser(args[1]);
        break;

      case "create":
        if (!args[1] || !args[2] || !args[3]) {
          log.error("Usage: npm run admin -- create <email> <password> <name>");
          process.exit(1);
        }
        await createAdmin(args[1], args[2], args[3]);
        break;

      case "reset-password":
        if (!args[1] || !args[2]) {
          log.error("Usage: npm run admin -- reset-password <email> <password>");
          process.exit(1);
        }
        await resetPassword(args[1], args[2]);
        break;

      case "list-admins":
        await listAdmins();
        break;

      case "list-users":
        await listUsers();
        break;

      default:
        log.error(`Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    log.error(error.message);
    console.error(error);
    process.exit(1);
  }
};

main();
