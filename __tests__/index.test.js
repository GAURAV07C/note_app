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
