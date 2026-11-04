# Mane Bazar — Documentation Index

Welcome to the comprehensive documentation suite for **Mane Bazar**. This directory organizes the platform's architectural specifications, development workflows, API documentation, and deployment guides.

---

## 📚 Documentation Directory

| Document | Description | Target Audience |
|----------|-------------|-----------------|
| [**System Architecture**](ARCHITECTURE.md) | High-level system overview, TypeScript monorepo layout, PostgreSQL relational schema, and concurrency control. | Architects & Engineers |
| [**Installation & Local Setup**](INSTALLATION.md) | Step-by-step local setup for Windows & macOS/Linux, prerequisites, PostgreSQL initialization, Prisma migrations, and troubleshooting. | Developers & Contributors |
| [**Environment Reference**](ENVIRONMENT.md) | Exhaustive breakdown of all environment variables for backend (`apps/backend/.env`), database (`packages/database/.env`), and frontend (`apps/frontend/.env`). | DevOps & Developers |
| [**REST API Specification**](API_REFERENCE.md) | Complete endpoint schemas, request/response bodies, query parameters, authentication, and error codes. | Frontend & API Integrators |
| [**Authentication & RBAC**](AUTHENTICATION.md) | Bcrypt salting, OTP email verification, Google OAuth 2.0 flow, JWT access/refresh rotation, and role security. | Security & Backend Developers |
| [**Payment Flow & Lifecycle**](PAYMENT_FLOW.md) | Razorpay checkout, UPI, COD, HMAC SHA-256 signature verification, webhook reconciliation, and atomic stock reservation. | Payment & Financial Engineers |
| [**Production Deployment**](DEPLOYMENT.md) | Releasing to Vercel/Netlify (frontend), Railway/Render/VPS (backend), managed cloud PostgreSQL, and SSL domains. | DevOps & System Administrators |
| [**Contribution Guidelines**](CONTRIBUTING.md) | Git branching strategy, Conventional Commits specification, pull request guidelines, and code review rules. | Open Source Contributors |
| [**Repository Audit Report**](REPOSITORY_AUDIT.md) | Detailed technical health check, dependency evaluation, feature verification matrix, and security audit. | Maintainers & Auditors |

---

## 🧭 Quick Links

- [Root README](../README.md)
- [Issue Templates](../.github/ISSUE_TEMPLATE/)
- [Pull Request Template](../.github/PULL_REQUEST_TEMPLATE.md)
- [Screenshot Asset Guidelines](../screenshots/README.md)

