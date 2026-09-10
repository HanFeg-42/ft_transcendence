import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { Prisma } from "../generated/prisma/client";

const { mockUserCreate } = vi.hoisted(() => ({
  mockUserCreate: vi.fn(),
}));

vi.mock("../prisma", () => ({
  prisma: {
    user: {
      create: mockUserCreate,
    },
  },
}));

import app from "../app";

describe("POST /register", () => {
  beforeEach(() => {
    mockUserCreate.mockReset();
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
