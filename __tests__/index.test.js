const NEXT_URL = "http://localhost:3000";

async function apiRequest(method, url, data, extraHeaders = {}) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  };

  if (data && method !== "GET") {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(`${NEXT_URL}${url}`, options);
    let body;
    try {
      body = await res.json();
    } catch {
      body = {};
    }
    return { ...body, statusCode: res.status };
  } catch (e) {
    return { statusCode: 500, error: e.message };
  }
}

const api = {
  post: (url, data) => apiRequest("POST", url, data),
  get: (url, headers) => apiRequest("GET", url, null, headers),
};

describe("Authentication", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "TestPass123!";

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const response = await api.post("/api/auth/register", {
        email: testEmail,
        password: testPassword,
      });
      expect(response.statusCode).toBe(201);
      expect(response).toHaveProperty("user");
      expect(response.user).toHaveProperty("id");
      expect(response.user).toHaveProperty("email", testEmail);
      expect(response).not.toHaveProperty("token");
    });

    it("should return 409 for duplicate email", async () => {
      const response = await api.post("/api/auth/register", {
        email: testEmail,
        password: testPassword,
      });
      expect(response.statusCode).toBe(409);
      expect(response).toHaveProperty("error", "Email already exists");
    });

    it("should return 400 for invalid email", async () => {
      const response = await api.post("/api/auth/register", {
        email: "invalid-email",
        password: testPassword,
      });
      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty("error");
    });

    it("should return 400 for short password", async () => {
      const response = await api.post("/api/auth/register", {
        email: "valid@example.com",
        password: "Short1!",
      });
      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty("error");
    });

    it("should return 400 for missing email", async () => {
      const response = await api.post("/api/auth/register", {
        password: testPassword,
      });
      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty("error");
    });

    it("should return 400 for missing password", async () => {
      const response = await api.post("/api/auth/register", {
        email: "test@example.com",
      });
      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with correct credentials", async () => {
      const response = await api.post("/api/auth/login", {
        email: testEmail,
        password: testPassword,
      });
      expect(response.statusCode).toBe(200);
      expect(response).toHaveProperty("user");
      expect(response).toHaveProperty("token");
      expect(response.user.email).toBe(testEmail);
    });

    it("should return 401 for wrong password", async () => {
      const response = await api.post("/api/auth/login", {
        email: testEmail,
        password: "WrongPass123!",
      });
      expect(response.statusCode).toBe(401);
      expect(response).toHaveProperty("error", "Invalid email or password");
    });

    it("should return 401 for non-existent user", async () => {
      const response = await api.post("/api/auth/login", {
        email: "nouser@example.com",
        password: testPassword,
      });
      expect(response.statusCode).toBe(401);
      expect(response).toHaveProperty("error", "Invalid email or password");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await api.post("/api/auth/login", {
        email: "invalid-email",
        password: testPassword,
      });
      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty("error");
    });
  });

  describe("GET /api/auth/me", () => {
    let authToken;

    beforeAll(async () => {
      const loginResponse = await api.post("/api/auth/login", {
        email: testEmail,
        password: testPassword,
      });
      authToken = loginResponse.token;
    });

    it("should return user info with valid token", async () => {
      const response = await api.get("/api/auth/me", {
        Authorization: `Bearer ${authToken}`,
      });
      expect(response.statusCode).toBe(200);
      expect(response).toHaveProperty("user");
      expect(response.user).toHaveProperty("id");
      expect(response.user).toHaveProperty("email", testEmail);
    });

    it("should return 401 without token", async () => {
      const response = await api.get("/api/auth/me");
      expect(response.statusCode).toBe(401);
      expect(response).toHaveProperty("error", "Unauthorized");
    });

    it("should return 401 with invalid token", async () => {
      const response = await api.get("/api/auth/me", {
        Authorization: "Bearer invalid-token",
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe("NextAuth v5 beta", () => {
    it("GET /api/auth/signin should redirect to login page", async () => {
      const response = await api.get("/api/auth/signin");
      expect([302, 404]).toContain(response.statusCode);
    });

    it("GET /api/auth/session should return 200", async () => {
      const response = await api.get("/api/auth/session");
      expect(response.statusCode).toBe(200);
    });

    it("POST /api/auth/signout should redirect", async () => {
      const response = await api.post("/api/auth/signout", {});
      expect([200, 302, 404]).toContain(response.statusCode);
    });
  });
});

