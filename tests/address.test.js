const request = require("supertest");
const app = require("../index");

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
