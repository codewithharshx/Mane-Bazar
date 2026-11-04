const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ensureCsrfCookie,
  requireCsrfForUnsafeMethods,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME
} = require("../middleware/csrfProtection");

const createMockRes = () => {
  const cookies = [];
  return {
    cookies,
    statusCode: 200,
    body: null,
    cookie(name, value, options) {
      cookies.push({ name, value, options });
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
};

test("ensureCsrfCookie sets cookie when missing", () => {
  const req = { cookies: {} };
  const res = createMockRes();
  let called = false;

  ensureCsrfCookie(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.ok(req.cookies[CSRF_COOKIE_NAME]);
  assert.equal(res.cookies.length, 1);
  assert.equal(res.cookies[0].name, CSRF_COOKIE_NAME);
});

test("requireCsrfForUnsafeMethods blocks invalid token for authenticated cookie sessions", () => {
  const req = {
    method: "POST",
    cookies: {
      accessToken: "access-token",
      [CSRF_COOKIE_NAME]: "cookie-token"
    },
    get(headerName) {
      if (headerName === CSRF_HEADER_NAME) return "header-token";
      return "";
    }
  };

  const res = createMockRes();
  let called = false;

  requireCsrfForUnsafeMethods(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Invalid CSRF token");
});

test("requireCsrfForUnsafeMethods allows matching token", () => {
  const token = "0123456789abcdef0123456789abcdef";
  const req = {
    method: "POST",
    cookies: {
      refreshToken: "refresh-token",
      [CSRF_COOKIE_NAME]: token
    },
    get(headerName) {
      if (headerName === CSRF_HEADER_NAME) return token;
      return "";
    }
  };

  const res = createMockRes();
  let called = false;

  requireCsrfForUnsafeMethods(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});
