import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "./generated/prisma/client";
import { prisma } from "./prisma";

export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: "username, email and password are required",
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      error: "username must be at least 3 characters long",
    });
  }

  if (!email.includes("@")) {
    return res.status(400).json({
      error: "email is invalid",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "password must be at least 8 characters long",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: "username or email already exists",
      });
    }

    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}