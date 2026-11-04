# Contributing to Mane Bazar

Thank you for your interest in contributing to **Mane Bazar**! We welcome bug fixes, documentation enhancements, UI polish, and feature additions that help empower local kirana grocery merchants.

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful and constructive in all issue discussions, code reviews, and pull requests.

---

## 2. Branching & Git Strategy

We follow a structured Git branching model:

- `main`: Production-ready, stable codebase. Direct commits to `main` are restricted.
- `develop`: Integration branch for upcoming releases.
- Feature branches: Created off `develop` (or `main`) using the following naming convention:
  - `feat/feature-name` (e.g., `feat/whatsapp-order-updates`)
  - `fix/bug-description` (e.g., `fix/coupon-percent-overflow`)
  - `docs/doc-update` (e.g., `docs/add-deployment-guide`)
  - `refactor/area-name` (e.g., `refactor/cart-state-hook`)

---

## 3. Development Workflow

### Step 1: Fork and Clone
```bash
git clone https://github.com/<your-username>/Mane-Bazar.git
cd Mane-Bazar
```

### Step 2: Install Dependencies
```bash
npm install
cd server && npm ci
cd ../client && npm ci
cd ..
```

### Step 3: Create a Feature Branch
```bash
git checkout -b feat/your-feature-name
```

### Step 4: Make Changes & Test Locally
- Run backend tests:
  ```bash
  cd server && npm test
  ```
- Verify frontend builds and module imports:
  ```bash
  cd client && npm run lint
  cd client && npm run build
  ```
- Run secret scanning before committing:
  ```bash
  npx secretlint "**/*"
  ```

---

## 4. Conventional Commit Messages

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Supported Types
- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `docs`: Documentation changes only.
- `style`: Changes that do not affect the meaning of code (formatting, white-space).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Build tasks, package updates, or CI workflow changes.

### Examples
- `feat(cart): add delivery distance calculation pill`
- `fix(order): prevent race condition during atomic stock reservation`
- `docs(api): document invoice stream endpoint query parameters`

---

## 5. Pull Request Guidelines

1. **Keep PRs Focused:** Submit small, targeted PRs rather than sprawling changes across unrelated domains.
2. **Never Commit Secrets:** Ensure `.env` files or personal API keys are never staged.
3. **Fill Out the PR Template:** Complete all sections of `.github/PULL_REQUEST_TEMPLATE.md`.
4. **CI Green:** All automated checks (Secret scanning, Client build, Server tests) must pass before merging.

