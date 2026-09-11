import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { Prisma } from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { mockUserCreate, mockUserFindUnique } = vi.hoisted(() => ({
  mockUserCreate: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock("../prisma", () => ({
  prisma: {
    user: {
      create: mockUserCreate,
      findUnique: mockUserFindUnique,
    },
  },
}));

import app from "../app";

describe("POST /register", () => {
  beforeEach(() => {
    mockUserCreate.mockReset();
    mockUserFindUnique.mockReset();

    process.env.JWT_SECRET = "test-secret";
  });

  it("registers a new user successfully", async () => {
    const fakeUser = {
      id: 1,
      username: "hanane",
      email: "hanane@example.com",
      passwordHash: "hashed-password",
      createdAt: new Date(),
    };

    mockUserCreate.mockResolvedValue(fakeUser);

    const response = await request(app).post("/register").send({
      username: "hanane",
      email: "hanane@example.com",
      password: "password123",
    });

    expect(response.status).toBe(201);

    expect(response.body.message).toBe("User registered successfully");

    expect(response.body.user).toEqual({
      id: 1,
      username: "hanane",
      email: "hanane@example.com",
      createdAt: fakeUser.createdAt.toISOString(),
    });
  });

  it("rejects registration when a required field is missing", async () => {
    const response = await request(app).post("/register").send({
      username: "hanane",
      email: "hanane@example.com",
      // password missing
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "username, email and password are required",
    });

    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("rejects registration when username is too short", async () => {
    const response = await request(app).post("/register").send({
      username: "ha",
      email: "hanane@example.com",
      password: "password123",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "username must be at least 3 characters long",
    });

    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("rejects registration when email is invalid", async () => {
    const response = await request(app).post("/register").send({
      username: "hanane",
      email: "hananeexample.com",
      password: "password123",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "email is invalid",
    });

    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("rejects registration when password is too short", async () => {
    const response = await request(app).post("/register").send({
      username: "hanane",
      email: "hanane@example.com",
      password: "short",
    });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "password must be at least 8 characters long",
    });

    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("rejects registration when username or email already exists", async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "7.9.1",
      },
    );

    mockUserCreate.mockRejectedValue(duplicateError);

    const response = await request(app).post("/register").send({
      username: "hanane",
      email: "hanane@example.com",
      password: "password123",
    });

    expect(response.status).toBe(409);

    expect(response.body).toEqual({
      error: "username or email already exists",
    });

    expect(mockUserCreate).toHaveBeenCalledTimes(1);
  });
});

describe("POST /login", () => {
  it("logs in a user with valid credentials", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);

    const fakeUser = {
      id: 1,
      username: "hanane",
      email: "hanane@example.com",
      passwordHash,
      createdAt: new Date(),
    };

    mockUserFindUnique.mockResolvedValue(fakeUser);

    const response = await request(app).post("/login").send({
      email: "hanane@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);

    expect(response.body.message).toBe("Login successful");

    expect(response.body.user).toEqual({
      id: 1,
      username: "hanane",
      email: "hanane@example.com",
    });

    expect(response.body.token).toBeDefined();

    expect(mockUserFindUnique).toHaveBeenCalledTimes(1);
  });

  it("rejects login when the user does not exist", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const response = await request(app).post("/login").send({
      email: "missing@example.com",
      password: "password123",
    });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: "Invalid email or password",
    });
  });

  it("rejects login when the password is incorrect", async () => {
    const passwordHash = await bcrypt.hash("correctpassword", 10);

    const fakeUser = {
      id: 1,
      username: "hanane",
      email: "hanane@example.com",
      passwordHash,
      createdAt: new Date(),
    };

    mockUserFindUnique.mockResolvedValue(fakeUser);

    const response = await request(app).post("/login").send({
      email: "hanane@example.com",
      password: "wrongpassword",
    });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: "Invalid email or password",
    });
  });

  it("issues a valid JWT containing the correct userId", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);

    const fakeUser = {
      id: 42,
      username: "hanane",
      email: "hanane@example.com",
      passwordHash,
      createdAt: new Date(),
    };

    mockUserFindUnique.mockResolvedValue(fakeUser);

    const response = await request(app).post("/login").send({
      email: "hanane@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();

    const decoded = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET as string,
      {
        algorithms: ["HS256"],
      },
    );

    expect(typeof decoded).not.toBe("string");

    if (typeof decoded !== "string") {
      expect(decoded.userId).toBe(42);
    }
  });
});

describe("GET /me", () => {
  it("returns the authenticated user with a valid JWT", async () => {
    const fakeUser = {
      id: 42,
      username: "hanane",
      email: "hanane@example.com",
      passwordHash: "hashed-password",
      createdAt: new Date(),
    };

    mockUserFindUnique.mockResolvedValue(fakeUser);

    const token = jwt.sign(
      {
        userId: 42,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      },
    );

    const response = await request(app)
      .get("/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.user).toEqual({
      id: 42,
      username: "hanane",
      email: "hanane@example.com",
      createdAt: fakeUser.createdAt.toISOString(),
    });

    expect(mockUserFindUnique).toHaveBeenCalledTimes(1);
  });

  it("rejects /me when no token is provided", async () => {
    const response = await request(app).get("/me");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: "Authentication required",
    });

    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("rejects /me when the token is invalid", async () => {
    const response = await request(app)
      .get("/me")
      .set("Authorization", "Bearer definitely-not-a-valid-token");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: "Invalid or expired token",
    });

    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("rejects /me when the token is expired", async () => {
    const expiredToken = jwt.sign(
      {
        userId: 42,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "-1s",
        algorithm: "HS256",
      },
    );

    const response = await request(app)
      .get("/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      error: "Invalid or expired token",
    });

    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });
});
