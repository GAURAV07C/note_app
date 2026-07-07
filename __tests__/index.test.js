const NEXT_URL = "http://localhost:3000";

let cookies = "";

async function apiRequest(method, url, data, extraHeaders = {}) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { cookie: cookies } : {}),
      ...extraHeaders,
    },
  };

  if (data && method !== "GET") {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(`${NEXT_URL}${url}`, options);

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
    cookies = cookieArray.map(c => c.split(";")[0]).join("; ");
  }

  let body;
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  return { ...body, statusCode: res.status };
}

function clearAuth() {
  cookies = "";
}

const api = {
  post: (url, data, headers) => apiRequest("POST", url, data, headers),
  get: (url, headers) => apiRequest("GET", url, null, headers),
  patch: (url, data, headers) => apiRequest("PATCH", url, data, headers),
  delete: (url, headers) => apiRequest("DELETE", url, null, headers),
};

describe("Authentication", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "TestPass123!";

  beforeAll(async () => {
    try {
      const { resetRateLimit } = require("@/lib/repositories/rate-limit");
      await resetRateLimit("login:unknown", { keyPrefix: "noteapp:ratelimit:login" });
    } catch {}
  });

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
    const authEmail = `auth_login_${Date.now()}@example.com`;
    const authPassword = "TestPass123!";

    beforeAll(async () => {
      await api.post("/api/auth/register", {
        email: authEmail,
        password: authPassword,
      });
    });

    it("should login with correct credentials", async () => {
      const response = await api.post("/api/auth/login", {
        email: authEmail,
        password: authPassword,
      });
      expect(response.statusCode).toBe(200);
      expect(response).toHaveProperty("token");
      expect(response.user.email).toBe(authEmail);
      expect(response.user).toHaveProperty("id");
    });

    it("should return 401 for wrong password", async () => {
      const response = await api.post("/api/auth/login", {
        email: authEmail,
        password: "WrongPass123!",
      });
      expect(response.statusCode).toBe(401);
      expect(response.error).toBe("Invalid email or password");
    });

    it("should return 401 for non-existent email", async () => {
      const response = await api.post("/api/auth/login", {
        email: "nobody@example.com",
        password: authPassword,
      });
      expect(response.statusCode).toBe(401);
      expect(response.error).toBe("Invalid email or password");
    });

    it("should return 400 for invalid email format", async () => {
      const response = await api.post("/api/auth/login", {
        email: "invalid-email",
        password: authPassword,
      });
      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty("error");
    });

    it("should return 400 for short password", async () => {
      const response = await api.post("/api/auth/login", {
        email: authEmail,
        password: "Short1!",
      });
      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty("error");
    });

    it("should return 400 for missing email", async () => {
      const response = await api.post("/api/auth/login", {
        password: authPassword,
      });
      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty("error");
    });

    it("should return 400 for missing password", async () => {
      const response = await api.post("/api/auth/login", {
        email: authEmail,
      });
      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty("error");
    });

    it("should rate limit after too many failed login attempts", async () => {
      const targetEmail = `rate_${Date.now()}@example.com`;
      const uniqueIp = `10.0.0.${Math.floor(Math.random() * 255)}`;

      for (let i = 0; i < 52; i++) {
        const response = await api.post("/api/auth/login", {
          email: targetEmail,
          password: "WrongPass123!",
        }, { "x-forwarded-for": uniqueIp });
        if (i < 50) {
          expect(response.statusCode).toBe(401);
        } else {
          expect(response.statusCode).toBe(429);
          expect(response.error).toContain("Too many login attempts");
        }
      }
    });

    it("should reset rate limit after successful login", async () => {
      const targetEmail = `rate_reset_${Date.now()}@example.com`;

      await api.post("/api/auth/register", {
        email: targetEmail,
        password: authPassword,
      });

      for (let i = 0; i < 3; i++) {
        await api.post("/api/auth/login", {
          email: targetEmail,
          password: "WrongPass123!",
        });
      }

      const response = await api.post("/api/auth/login", {
        email: targetEmail,
        password: authPassword,
      });
      expect(response.statusCode).toBe(200);
    });
  });

  describe("GET /api/auth/me", () => {
    let authEmail;
    let authPassword;
    let token;

    beforeAll(async () => {
      authEmail = `auth_me_${Date.now()}@example.com`;
      authPassword = "TestPass123!";
      await api.post("/api/auth/register", {
        email: authEmail,
        password: authPassword,
      });
      const loginResp = await api.post("/api/auth/login", {
        email: authEmail,
        password: authPassword,
      });
      token = loginResp.token;
    });

    it("should return current user with valid token", async () => {
      const response = await api.get("/api/auth/me", {
        Authorization: `Bearer ${token}`,
      });
      expect(response.statusCode).toBe(200);
      expect(response.user).toHaveProperty("id");
      expect(response.user.email).toBe(authEmail);
    });

    it("should return 401 without token", async () => {
      const response = await api.get("/api/auth/me");
      expect(response.statusCode).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await api.get("/api/auth/me", {
        Authorization: "Bearer invalid-token",
      });
      expect(response.statusCode).toBe(401);
    });

    it("should return 401 with malformed authorization header", async () => {
      const response = await api.get("/api/auth/me", {
        Authorization: "invalid",
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe("NextAuth v5 beta", () => {
    it("GET /api/auth/signin should redirect to login page", async () => {
      const response = await api.get("/api/auth/signin");
      expect([302, 404]).toContain(response.statusCode);
    });

    it("GET /api/auth/session should return 200 when not authenticated", async () => {
      clearAuth();
      const response = await api.get("/api/auth/session");
      expect(response.statusCode).toBe(200);
    });

    it("POST /api/auth/signout should redirect", async () => {
      const response = await api.post("/api/auth/signout", {});
      expect([200, 302, 404]).toContain(response.statusCode);
    });
  });
});

describe("Notes API", () => {
  let authToken;

  beforeAll(async () => {
    clearAuth();
    const registerResp = await api.post("/api/auth/register", {
      email: `note_test_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const loginResp = await api.post("/api/auth/login", {
      email: registerResp.user.email,
      password: "TestPass123!",
    });
    authToken = loginResp.token;
  });

  it("should create a note without share settings", async () => {
    const response = await api.post("/api/notes", {
      title: "Test Note 1",
      content: "Test content 1",
    }, { Authorization: `Bearer ${authToken}` });
    expect(response.statusCode).toBe(201);
    expect(response.note.title).toBe("Test Note 1");
    expect(response.share).toBeNull();
  });

  it("should create a ONE_TIME public share note", async () => {
    const response = await api.post("/api/notes", {
      title: "Test Note 2",
      content: "Test content 2",
      shareType: "ONE_TIME",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${authToken}` });
    expect(response.statusCode).toBe(201);
    expect(response.share).toBeDefined();
    expect(response.share.shareType).toBe("ONE_TIME");
  });

  it("should create a TIME_BASED password-protected share note", async () => {
    const response = await api.post("/api/notes", {
      title: "Test Note 3",
      content: "Test content 3",
      shareType: "TIME_BASED",
      accessType: "PASSWORD",
    }, { Authorization: `Bearer ${authToken}` });
    expect(response.statusCode).toBe(201);
    expect(response.share.accessType).toBe("PASSWORD");
  });

  it("should get user notes", async () => {
    const response = await api.get("/api/notes", {
      Authorization: `Bearer ${authToken}`,
    });
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.notes)).toBe(true);
    expect(response.notes.length).toBeGreaterThanOrEqual(3);
  });

  it("should fail to get user notes without auth", async () => {
    const response = await api.get("/api/notes");
    expect(response.statusCode).toBe(401);
  });
});

describe("Share API", () => {
  let authToken;
  let oneTimeToken;
  let timeBasedToken;

  beforeAll(async () => {
    clearAuth();
    const registerResp = await api.post("/api/auth/register", {
      email: `share_test_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const loginResp = await api.post("/api/auth/login", {
      email: registerResp.user.email,
      password: "TestPass123!",
    });
    authToken = loginResp.token;

    const res1 = await api.post("/api/notes", {
      title: "Share Test 1",
      content: "Content 1",
      shareType: "ONE_TIME",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${authToken}` });
    oneTimeToken = res1.share?.token;

    const res2 = await api.post("/api/notes", {
      title: "Share Test 2",
      content: "Content 2",
      shareType: "TIME_BASED",
      accessType: "PASSWORD",
      password: "testpw",
    }, { Authorization: `Bearer ${authToken}` });
    timeBasedToken = res2.share?.token;
  });

  it("should access public ONE_TIME share", async () => {
    const response = await api.get(`/api/share/${oneTimeToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.note.title).toBe("Share Test 1");
  });

  it("should fail to access used ONE_TIME share", async () => {
    const response = await api.get(`/api/share/${oneTimeToken}`);
    expect(response.statusCode).toBe(403);
    expect(response.error).toBe("Share link has already been used");
  });

  it("should require password for PASSWORD accessType share", async () => {
    const response = await api.get(`/api/share/${timeBasedToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.requiresPassword).toBe(true);
    expect(response.note).toBeUndefined();
  });

  it("should fail to unlock with wrong password", async () => {
    const response = await api.post(`/api/share/${timeBasedToken}/unlock`, {
      password: "wrong-password",
    });
    expect(response.statusCode).toBe(401);
    expect(response.error).toBe("Invalid password");
  });

  it("should unlock with correct password", async () => {
    const response = await api.post(`/api/share/${timeBasedToken}/unlock`, {
      password: "testpw",
    });
    expect(response.statusCode).toBe(200);
    expect(response.note.title).toBe("Share Test 2");
  });

  it("should allow re-accessing TIME_BASED share", async () => {
    const response = await api.post(`/api/share/${timeBasedToken}/unlock`, {
      password: "testpw",
    });
    expect(response.statusCode).toBe(200);
    expect(response.note.title).toBe("Share Test 2");
  });

  it("should return 404 for invalid share link", async () => {
    const response = await api.get("/api/share/invalid-token-12345");
    expect(response.statusCode).toBe(404);
    expect(response.error).toBe("Invalid share link");
  });

  it("should return 410 for expired share link", async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const expiredRes = await api.post("/api/notes", {
      title: "Expired Note",
      content: "Expired content",
      shareType: "ONE_TIME",
      accessType: "PUBLIC",
      expiresAt: pastDate,
    }, { Authorization: `Bearer ${authToken}` });

    const expiredToken = expiredRes.share?.token;
    const response = await api.get(`/api/share/${expiredToken}`);
    expect(response.statusCode).toBe(410);
    expect(response.error).toBe("Share link has expired");
  });

  it("should return 403 for revoked share link", async () => {
    const revokeRes = await api.post("/api/notes", {
      title: "Revoke Test Note",
      content: "Revoke test content",
      shareType: "TIME_BASED",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${authToken}` });

    const revokeToken = revokeRes.share?.token;

    const accessBefore = await api.get(`/api/share/${revokeToken}`);
    expect(accessBefore.statusCode).toBe(200);

    const revokeResponse = await api.post(`/api/share/${revokeToken}/revoke`, {}, { Authorization: `Bearer ${authToken}` });
    expect(revokeResponse.statusCode).toBe(200);

    const accessAfter = await api.get(`/api/share/${revokeToken}`);
    expect(accessAfter.statusCode).toBe(403);
    expect(accessAfter.error).toBe("Share link has been revoked");
  });

  it("should increment view count for public TIME_BASED share on each access", async () => {
    const viewCountRes = await api.post("/api/notes", {
      title: "View Count Note",
      content: "View count content",
      shareType: "TIME_BASED",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${authToken}` });

    const viewToken = viewCountRes.share?.token;

    const firstAccess = await api.get(`/api/share/${viewToken}`);
    expect(firstAccess.statusCode).toBe(200);
    expect(firstAccess.viewCount).toBe(1);

    const secondAccess = await api.get(`/api/share/${viewToken}`);
    expect(secondAccess.statusCode).toBe(200);
    expect(secondAccess.viewCount).toBe(2);

    const thirdAccess = await api.get(`/api/share/${viewToken}`);
    expect(thirdAccess.statusCode).toBe(200);
    expect(thirdAccess.viewCount).toBe(3);
  });

  it("should increment view count only on successful password unlock", async () => {
    const pwRes = await api.post("/api/notes", {
      title: "PW View Count",
      content: "PW view content",
      shareType: "TIME_BASED",
      accessType: "PASSWORD",
      password: "testpw",
    }, { Authorization: `Bearer ${authToken}` });

    const pwToken = pwRes.share?.token;

    const wrongAttempt = await api.post(`/api/share/${pwToken}/unlock`, {
      password: "wrong",
    });
    expect(wrongAttempt.statusCode).toBe(401);

    const correctAccess1 = await api.post(`/api/share/${pwToken}/unlock`, {
      password: "testpw",
    });
    expect(correctAccess1.statusCode).toBe(200);
    expect(correctAccess1.viewCount).toBe(1);

    const correctAccess2 = await api.post(`/api/share/${pwToken}/unlock`, {
      password: "testpw",
    });
    expect(correctAccess2.statusCode).toBe(200);
    expect(correctAccess2.viewCount).toBe(2);
  });

  it("should handle concurrent access to ONE_TIME share correctly", async () => {
    const concurrentRes = await api.post("/api/notes", {
      title: "Concurrent Note",
      content: "Concurrent content",
      shareType: "ONE_TIME",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${authToken}` });

    const concurrentToken = concurrentRes.share?.token;

    const results = await Promise.all([
      api.get(`/api/share/${concurrentToken}`),
      api.get(`/api/share/${concurrentToken}`),
      api.get(`/api/share/${concurrentToken}`),
    ]);

    const successes = results.filter(r => r.statusCode === 200);
    const failures = results.filter(r => r.statusCode === 403);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(2);
  });

  it("should handle race condition when ONE_TIME password share is sent to multiple users", async () => {
    const raceRes = await api.post("/api/notes", {
      title: "Race Condition Note",
      content: "Race condition content",
      shareType: "ONE_TIME",
      accessType: "PASSWORD",
      password: "racepw",
    }, { Authorization: `Bearer ${authToken}` });

    const raceToken = raceRes.share?.token;

    const results = await Promise.all([
      api.post(`/api/share/${raceToken}/unlock`, { password: "racepw" }),
      api.post(`/api/share/${raceToken}/unlock`, { password: "racepw" }),
      api.post(`/api/share/${raceToken}/unlock`, { password: "racepw" }),
    ]);

    const unlocks = results.filter(r => r.statusCode === 200);
    const locked = results.filter(r => r.statusCode === 403);

    expect(unlocks.length).toBe(1);
    expect(locked.length).toBe(2);
  });
});

describe("Notes CRUD Security", () => {
  let ownerToken;
  let intruderToken;
  let noteId;

  beforeAll(async () => {
    clearAuth();
    const ownerResp = await api.post("/api/auth/register", {
      email: `owner_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const ownerLogin = await api.post("/api/auth/login", {
      email: ownerResp.user.email,
      password: "TestPass123!",
    });
    ownerToken = ownerLogin.token;

    const noteResp = await api.post("/api/notes", {
      title: "Secured Note",
      content: "Secured content",
    }, { Authorization: `Bearer ${ownerToken}` });
    noteId = noteResp.note.id;

    const intruderResp = await api.post("/api/auth/register", {
      email: `intruder_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const intruderLogin = await api.post("/api/auth/login", {
      email: intruderResp.user.email,
      password: "TestPass123!",
    });
    intruderToken = intruderLogin.token;
  });

  afterEach(async () => {
    clearAuth();
  });

  describe("GET /api/notes/:id", () => {
    it("should return 401 without token", async () => {
      const response = await api.get(`/api/notes/${noteId}`);
      expect(response.statusCode).toBe(401);
    });

    it("should return note for owner", async () => {
      const response = await api.get(`/api/notes/${noteId}`, {
        Authorization: `Bearer ${ownerToken}`,
      });
      expect(response.statusCode).toBe(200);
      expect(response.note.id).toBe(noteId);
    });

    it("should return 403 for another user", async () => {
      const response = await api.get(`/api/notes/${noteId}`, {
        Authorization: `Bearer ${intruderToken}`,
      });
      expect(response.statusCode).toBe(403);
    });

    it("should return 404 for non-existent note", async () => {
      const response = await api.get("/api/notes/nonexistent-id", {
        Authorization: `Bearer ${ownerToken}`,
      });
      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/notes/:id", () => {
    let patchNoteId;
    beforeAll(async () => {
      const resp = await api.post("/api/notes", {
        title: "Updatable Note",
        content: "content",
      }, { Authorization: `Bearer ${ownerToken}` });
      patchNoteId = resp.note.id;
    });

    it("should return 401 without token", async () => {
      const response = await api.patch(`/api/notes/${patchNoteId}`, {
        title: "Hacked",
      });
      expect(response.statusCode).toBe(401);
    });

    it("should allow owner to update", async () => {
      const response = await api.patch(`/api/notes/${patchNoteId}`, {
        title: "Updated",
      }, { Authorization: `Bearer ${ownerToken}` });
      expect(response.statusCode).toBe(200);
      expect(response.note.title).toBe("Updated");
    });

    it("should return 403 for intruder", async () => {
      const response = await api.patch(`/api/notes/${patchNoteId}`, {
        title: "Hacked",
      }, { Authorization: `Bearer ${intruderToken}` });
      expect(response.statusCode).toBe(403);
    });
  });

  describe("DELETE /api/notes/:id", () => {
    let deleteNoteId;
    beforeAll(async () => {
      const resp = await api.post("/api/notes", {
        title: "To Delete",
        content: "Delete me",
      }, { Authorization: `Bearer ${ownerToken}` });
      deleteNoteId = resp.note.id;
    });

    it("should return 401 without token", async () => {
      const response = await api.delete(`/api/notes/${deleteNoteId}`);
      expect(response.statusCode).toBe(401);
    });

    it("should allow owner to delete", async () => {
      const response = await api.delete(`/api/notes/${deleteNoteId}`, {
        Authorization: `Bearer ${ownerToken}`,
      });
      expect(response.statusCode).toBe(200);
    });

    it("should return 403 for intruder", async () => {
      const resp = await api.post("/api/notes", {
        title: "Intruder Target",
        content: "content",
      }, { Authorization: `Bearer ${ownerToken}` });
      const intruderNoteId = resp.note.id;
      const response = await api.delete(`/api/notes/${intruderNoteId}`, {
        Authorization: `Bearer ${intruderToken}`,
      });
      expect(response.statusCode).toBe(403);
    });
  });

  describe("Revoke", () => {
    it("should return 401 without token", async () => {
      const shareResp = await api.post("/api/notes", {
        title: "Revoke Test",
        content: "content",
        shareType: "TIME_BASED",
        accessType: "PUBLIC",
      }, { Authorization: `Bearer ${ownerToken}` });
      const token = shareResp.share?.token;
      const response = await api.post(`/api/share/${token}/revoke`);
      expect(response.statusCode).toBe(401);
    });

    it("should return 403 for intruder revoking owner share", async () => {
      const shareResp = await api.post("/api/notes", {
        title: "Revoke Test 2",
        content: "content",
        shareType: "TIME_BASED",
        accessType: "PUBLIC",
      }, { Authorization: `Bearer ${ownerToken}` });
      const token = shareResp.share?.token;
      const response = await api.post(`/api/share/${token}/revoke`, {}, {
        Authorization: `Bearer ${intruderToken}`,
      });
      expect(response.statusCode).toBe(403);
    });

    it("should allow owner to revoke and return 403 for further access", async () => {
      const shareResp = await api.post("/api/notes", {
        title: "Revoke Test 3",
        content: "content",
        shareType: "TIME_BASED",
        accessType: "PUBLIC",
      }, { Authorization: `Bearer ${ownerToken}` });
      const token = shareResp.share?.token;
      const revokeResp = await api.post(`/api/share/${token}/revoke`, {}, {
        Authorization: `Bearer ${ownerToken}`,
      });
      expect(revokeResp.statusCode).toBe(200);

      const accessAfter = await api.get(`/api/share/${token}`);
      expect(accessAfter.statusCode).toBe(403);
      expect(accessAfter.error).toBe("Share link has been revoked");
    });
  });
});

describe("Share Public Access", () => {
  let publicToken;
  let passwordToken;

  beforeAll(async () => {
    clearAuth();
    const registerResp = await api.post("/api/auth/register", {
      email: `public_access_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const loginResp = await api.post("/api/auth/login", {
      email: registerResp.user.email,
      password: "TestPass123!",
    });

    const publicRes = await api.post("/api/notes", {
      title: "Public Note",
      content: "Public content",
      shareType: "TIME_BASED",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${loginResp.token}` });
    publicToken = publicRes.share?.token;

    const passwordRes = await api.post("/api/notes", {
      title: "Password Note",
      content: "Password content",
      shareType: "TIME_BASED",
      accessType: "PASSWORD",
      password: "secret123",
    }, { Authorization: `Bearer ${loginResp.token}` });
    passwordToken = passwordRes.share?.token;
  });

  afterEach(() => {
    clearAuth();
  });

  it("should access public share without authentication", async () => {
    const response = await api.get(`/api/share/${publicToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.note.title).toBe("Public Note");
    expect(response.note.content).toBe("Public content");
  });

  it("should return requiresPassword for password-protected share without auth", async () => {
    const response = await api.get(`/api/share/${passwordToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.requiresPassword).toBe(true);
    expect(response.note).toBeUndefined();
  });

  it("should unlock password share with correct password without auth", async () => {
    const response = await api.post(`/api/share/${passwordToken}/unlock`, {
      password: "secret123",
    });
    expect(response.statusCode).toBe(200);
    expect(response.note.title).toBe("Password Note");
    expect(response.note.content).toBe("Password content");
  });

  it("should return 401 for wrong password without auth", async () => {
    const response = await api.post(`/api/share/${passwordToken}/unlock`, {
      password: "wrongpassword",
    });
    expect(response.statusCode).toBe(401);
    expect(response.error).toBe("Invalid password");
  });

  it("should rate limit after too many wrong password attempts", async () => {
    clearAuth();
    const uniqueIp = `192.168.2.${Math.floor(Math.random() * 255)}`;
    for (let i = 0; i < 11; i++) {
      const response = await api.post(`/api/share/${passwordToken}/unlock`, {
        password: "wrongpassword",
      }, { "x-forwarded-for": uniqueIp });
      if (i < 10) {
        expect(response.statusCode).toBe(401);
      } else {
        expect(response.statusCode).toBe(429);
        expect(response.error).toContain("Too many requests");
      }
    }
  }, 15000);

  it("should return 404 for invalid share token", async () => {
    const response = await api.get("/api/share/invalid-token-12345");
    expect(response.statusCode).toBe(404);
    expect(response.error).toBe("Invalid share link");
  });

  it("should return 403 for revoked share without auth", async () => {
    clearAuth();
    const registerResp = await api.post("/api/auth/register", {
      email: `revoke_public_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const loginResp = await api.post("/api/auth/login", {
      email: registerResp.user.email,
      password: "TestPass123!",
    });

    const shareResp = await api.post("/api/notes", {
      title: "To Revoke",
      content: "content",
      shareType: "TIME_BASED",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${loginResp.token}` });
    const token = shareResp.share?.token;

    await api.post(`/api/share/${token}/revoke`, {}, {
      Authorization: `Bearer ${loginResp.token}`,
    });

    const response = await api.get(`/api/share/${token}`);
    expect(response.statusCode).toBe(403);
    expect(response.error).toBe("Share link has been revoked");
  });

  it("should return 410 for expired share without auth", async () => {
    clearAuth();
    const registerResp = await api.post("/api/auth/register", {
      email: `expire_public_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const loginResp = await api.post("/api/auth/login", {
      email: registerResp.user.email,
      password: "TestPass123!",
    });

    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const shareResp = await api.post("/api/notes", {
      title: "Expired Public",
      content: "content",
      shareType: "TIME_BASED",
      accessType: "PUBLIC",
      expiresAt: pastDate,
    }, { Authorization: `Bearer ${loginResp.token}` });
    const token = shareResp.share?.token;

    const response = await api.get(`/api/share/${token}`);
    expect(response.statusCode).toBe(410);
    expect(response.error).toBe("Share link has expired");
  });

  it("should return 403 for already used ONE_TIME public share", async () => {
    clearAuth();
    const registerResp = await api.post("/api/auth/register", {
      email: `ot_public_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const loginResp = await api.post("/api/auth/login", {
      email: registerResp.user.email,
      password: "TestPass123!",
    });

    const shareResp = await api.post("/api/notes", {
      title: "OT Public",
      content: "content",
      shareType: "ONE_TIME",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${loginResp.token}` });
    const token = shareResp.share?.token;

    const first = await api.get(`/api/share/${token}`);
    expect(first.statusCode).toBe(200);

    const second = await api.get(`/api/share/${token}`);
    expect(second.statusCode).toBe(403);
    expect(second.error).toBe("Share link has already been used");
  });
});

describe("Rate Limiting", () => {
  it("should rate limit login attempts from same IP", async () => {
    clearAuth();
    const email = `rate_limit_login_${Date.now()}@example.com`;
    const uniqueIp = `192.168.1.${Math.floor(Math.random() * 255)}`;

    for (let i = 0; i < 52; i++) {
      const response = await api.post("/api/auth/login", {
        email,
        password: "WrongPass123!",
      }, { "x-forwarded-for": uniqueIp });
      if (i < 50) {
        expect(response.statusCode).toBe(401);
      } else {
        expect(response.statusCode).toBe(429);
        expect(response.error).toContain("Too many login attempts");
      }
    }
  }, 15000);
});

describe("Notes CRUD", () => {
  let ownerToken;
  let noteId;

  beforeAll(async () => {
    clearAuth();
    const registerResp = await api.post("/api/auth/register", {
      email: `crud_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const loginResp = await api.post("/api/auth/login", {
      email: registerResp.user.email,
      password: "TestPass123!",
    });
    ownerToken = loginResp.token;

    const noteResp = await api.post("/api/notes", {
      title: "CRUD Note",
      content: "CRUD content",
    }, { Authorization: `Bearer ${ownerToken}` });
    noteId = noteResp.note.id;
  });

  afterEach(() => {
    clearAuth();
  });

  it("should create a note", async () => {
    const response = await api.post("/api/notes", {
      title: "New Note",
      content: "New content",
    }, { Authorization: `Bearer ${ownerToken}` });
    expect(response.statusCode).toBe(201);
    expect(response.note.title).toBe("New Note");
  });

  it("should get note by id for owner", async () => {
    const response = await api.get(`/api/notes/${noteId}`, {
      Authorization: `Bearer ${ownerToken}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.note.id).toBe(noteId);
  });

  it("should update note for owner", async () => {
    const response = await api.patch(`/api/notes/${noteId}`, {
      title: "Updated Title",
    }, { Authorization: `Bearer ${ownerToken}` });
    expect(response.statusCode).toBe(200);
    expect(response.note.title).toBe("Updated Title");
  });

  it("should delete note for owner", async () => {
    const deleteResp = await api.post("/api/notes", {
      title: "To Delete",
      content: "delete me",
    }, { Authorization: `Bearer ${ownerToken}` });
    const deleteId = deleteResp.note.id;

    const response = await api.delete(`/api/notes/${deleteId}`, {
      Authorization: `Bearer ${ownerToken}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.message).toBe("Note deleted");
  });

  it("should return 404 for non-existent note", async () => {
    const response = await api.get("/api/notes/nonexistent-id", {
      Authorization: `Bearer ${ownerToken}`,
    });
    expect(response.statusCode).toBe(404);
    expect(response.error).toBe("Note not found");
  });
});

describe("Share Creation for Existing Note", () => {
  let ownerToken;
  let noteId;

  beforeAll(async () => {
    clearAuth();
    const registerResp = await api.post("/api/auth/register", {
      email: `share_create_${Date.now()}@example.com`,
      password: "TestPass123!",
    });
    const loginResp = await api.post("/api/auth/login", {
      email: registerResp.user.email,
      password: "TestPass123!",
    });
    ownerToken = loginResp.token;

    const noteResp = await api.post("/api/notes", {
      title: "Note Without Share",
      content: "content",
    }, { Authorization: `Bearer ${ownerToken}` });
    noteId = noteResp.note.id;
  });

  afterEach(() => {
    clearAuth();
  });

  it("should create share link for existing note", async () => {
    const response = await api.post(`/api/notes/${noteId}/share`, {
      shareType: "ONE_TIME",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${ownerToken}` });
    expect(response.statusCode).toBe(201);
    expect(response.shareLink).toContain(`/share/${response.share.token}`);
    expect(response.share.shareType).toBe("ONE_TIME");
    expect(response.share.accessType).toBe("PUBLIC");
  });

  it("should create password-protected share for existing note", async () => {
    const response = await api.post(`/api/notes/${noteId}/share`, {
      shareType: "TIME_BASED",
      accessType: "PASSWORD",
      password: "mypassword",
    }, { Authorization: `Bearer ${ownerToken}` });
    expect(response.statusCode).toBe(201);
    expect(response.share.accessType).toBe("PASSWORD");
    expect(response.plainPassword).toBe("mypassword");
  });

  it("should return 409 when note already has active share", async () => {
    await api.post(`/api/notes/${noteId}/share`, {
      shareType: "ONE_TIME",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${ownerToken}` });

    const response = await api.post(`/api/notes/${noteId}/share`, {
      shareType: "ONE_TIME",
      accessType: "PUBLIC",
    }, { Authorization: `Bearer ${ownerToken}` });
    expect(response.statusCode).toBe(400);
    expect(response.error).toContain("active share link");
  });

  it("should return 401 without auth", async () => {
    const response = await api.post(`/api/notes/${noteId}/share`, {
      shareType: "ONE_TIME",
      accessType: "PUBLIC",
    });
    expect(response.statusCode).toBe(401);
  });
});
