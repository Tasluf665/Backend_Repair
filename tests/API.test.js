const request = require("supertest");
const app = require("../index");

describe("Auth API test", () => {
  let refreshToken;

  beforeAll(async () => {
    refreshToken = await request(app).post("/api/auth/").send({
      email: "rhyme665@gmail.com",
      password: "12345",
    });
    refreshToken = JSON.parse(refreshToken.text);
    refreshToken = refreshToken.data.refreshToken;
  });

  describe("Check /api/auth route", () => {
    test("Provide Correct Email and Password to get the auth token", async () => {
      const response = await request(app).post("/api/auth/").send({
        email: "rhyme665@gmail.com",
        password: "12345",
      });

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(200);
      expect(result.data.token).not.toBeNull();
      expect(result.success).not.toBeNull();
    });

    test("Provide Incorrect Email and Password to get the auth token", async () => {
      const response = await request(app).post("/api/auth/").send({
        email: "rhyme665@gmail.com",
        password: "12346",
      });

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(400);
      expect(result.error).not.toBeNull();
    });

    test("Provide only Email to get the auth token", async () => {
      const response = await request(app).post("/api/auth/").send({
        email: "rhyme665@gmail.com",
      });

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(400);
      expect(result.error).not.toBeNull();
    });
  });

  describe("Check /api/auth/newToken route", () => {
    test("Provide refresh token to get new token", async () => {
      const response = await request(app).post("/api/auth/newToken").set({
        "refresh-token": refreshToken,
      });

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(200);
      expect(result.data.token).not.toBeNull();
      expect(result.success).not.toBeNull();
    });

    test("Provide no refresh token to get new token", async () => {
      const response = await request(app).post("/api/auth/newToken");

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(401);
      expect(result.error).not.toBeNull();
    });
  });
});

describe("Address API test", () => {
  let token;

  beforeAll(async () => {
    token = await request(app).post("/api/auth/").send({
      email: "rhyme665@gmail.com",
      password: "12345",
    });
    token = JSON.parse(token.text);
    token = token.data.token;
  });

  test("Get the address list with authentication", async () => {
    const response = await request(app).get("/api/address/").set({
      "x-auth-token": token,
    });

    let result = JSON.parse(response.text);

    expect(response.statusCode).toBe(200);
    expect(result.data).not.toBeNull();
    expect(result.success).not.toBeNull();
  });

  test("Get 401 error without authentication token", async () => {
    const response = await request(app).get("/api/address/");

    let result = JSON.parse(response.text);

    expect(response.statusCode).toBe(401);
    expect(result.error).not.toBeNull();
  });
});

describe("Agent API test", () => {
  let adminToken, userToken;

  beforeAll(async () => {
    adminToken = await request(app).post("/api/auth/").send({
      email: "rhyme665@gmail.com",
      password: "12345",
    });
    adminToken = JSON.parse(adminToken.text);
    adminToken = adminToken.data.token;

    userToken = await request(app).post("/api/auth/").send({
      email: "rhymemorshed665@gmail.com",
      password: "12345",
    });
    userToken = JSON.parse(userToken.text);
    userToken = userToken.data.token;
  });

  describe("/allAgents route testing", () => {
    test("Get all agents with admin token", async () => {
      const response = await request(app).get("/api/agents/allAgents").set({
        "x-auth-token": adminToken,
      });

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(200);
      expect(result.data).not.toBeNull();
      expect(result.success).not.toBeNull();
    });

    test("Try to get all agents with user token", async () => {
      const response = await request(app).get("/api/agents/allAgents").set({
        "x-auth-token": userToken,
      });

      expect(response.statusCode).toBe(403);
    });

    test("Get 401 error without authentication token", async () => {
      const response = await request(app).get("/api/agents/allAgents");

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(401);
      expect(result.error).not.toBeNull();
    });
  });

  describe("/ route testing", () => {
    test("Get max 10 agents with admin token", async () => {
      const response = await request(app).get("/api/agents/").set({
        "x-auth-token": adminToken,
      });

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(200);
      expect(result.data).not.toBeNull();
      expect(result.success).not.toBeNull();
    });

    test("Try to get agents with user token", async () => {
      const response = await request(app).get("/api/agents/allAgents").set({
        "x-auth-token": userToken,
      });

      expect(response.statusCode).toBe(403);
    });

    test("Get 401 error without authentication token", async () => {
      const response = await request(app).get("/api/agents/allAgents");

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(401);
      expect(result.error).not.toBeNull();
    });
  });

  describe("/:id route testing", () => {
    test("Get agent by id with admin token", async () => {
      const response = await request(app)
        .get("/api/agents/62eb2bdf4f51be3516a0bc9b")
        .set({
          "x-auth-token": adminToken,
        });

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(200);
      expect(result.data).not.toBeNull();
      expect(result.success).not.toBeNull();
    });

    test("Try to get agent by id with user token", async () => {
      const response = await request(app)
        .get("/api/agents/62eb2bdf4f51be3516a0bc9b")
        .set({
          "x-auth-token": userToken,
        });

      expect(response.statusCode).toBe(403);
    });

    test("Get 401 error without authentication token", async () => {
      const response = await request(app).get(
        "/api/agents/62eb2bdf4f51be3516a0bc9b"
      );

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(401);
      expect(result.error).not.toBeNull();
    });
  });
});

describe("Technician API test", () => {
  let adminToken, userToken;

  beforeAll(async () => {
    adminToken = await request(app).post("/api/auth/").send({
      email: "rhyme665@gmail.com",
      password: "12345",
    });
    adminToken = JSON.parse(adminToken.text);
    adminToken = adminToken.data.token;

    userToken = await request(app).post("/api/auth/").send({
      email: "rhymemorshed665@gmail.com",
      password: "12345",
    });
    userToken = JSON.parse(userToken.text);
    userToken = userToken.data.token;
  });

  describe("/allTechnicians route testing", () => {
    test("Get all technicians with admin token", async () => {
      const response = await request(app)
        .get("/api/technicians/allTechnicians")
        .set({
          "x-auth-token": adminToken,
        });

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(200);
      expect(result.data).not.toBeNull();
      expect(result.success).not.toBeNull();
    });

    test("Try to get all technicians with user token", async () => {
      const response = await request(app)
        .get("/api/technicians/allTechnicians")
        .set({
          "x-auth-token": userToken,
        });

      expect(response.statusCode).toBe(403);
    });

    test("Get 401 error without authentication token", async () => {
      const response = await request(app).get(
        "/api/technicians/allTechnicians"
      );

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(401);
      expect(result.error).not.toBeNull();
    });
  });
});

describe("Order API test", () => {
  let adminToken, userToken;

  beforeAll(async () => {
    adminToken = await request(app).post("/api/auth/").send({
      email: "rhyme665@gmail.com",
      password: "12345",
    });
    adminToken = JSON.parse(adminToken.text);
    adminToken = adminToken.data.token;

    userToken = await request(app).post("/api/auth/").send({
      email: "rhymemorshed665@gmail.com",
      password: "12345",
    });
    userToken = JSON.parse(userToken.text);
    userToken = userToken.data.token;
  });

  describe("/ route testing", () => {
    test("Get all orders with admin token", async () => {
      const response = await request(app).get("/api/orders/").set({
        "x-auth-token": adminToken,
      });

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(200);
      expect(result.data).not.toBeNull();
      expect(result.success).not.toBeNull();
    });

    test("Try to get all orders with user token", async () => {
      const response = await request(app).get("/api/orders/").set({
        "x-auth-token": userToken,
      });

      expect(response.statusCode).toBe(403);
    });

    test("Get 401 error without authentication token", async () => {
      const response = await request(app).get("/api/orders/");

      let result = JSON.parse(response.text);

      expect(response.statusCode).toBe(401);
      expect(result.error).not.toBeNull();
    });
  });
});
