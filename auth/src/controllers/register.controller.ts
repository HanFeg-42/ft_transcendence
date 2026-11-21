import type { Request, Response } from "express";
import { registerUser } from "../services/auth.service";

export async function register(req: Request, res: Response) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      error: "Invalid request body",
    });
  }
  // to test nobody: curl -k -X POST https://localhost/api/auth/register
  const { username, email, password } = body;

  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      error: "username, email and password must be strings",
    });
  }

  if (!username.trim() || !email.trim() || !password) {
    return res.status(400).json({
      error: "username, email and password are required",
    });
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[A-Za-z0-9_-]{3,20}$/.test(normalizedUsername)) {
    return res.status(400).json({
      error:
        "Username must be 3-20 characters and contain only letters, numbers, _ or -",
    });
  }

  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return res.status(400).json({
      error: "Invalid email format",
    });
  }

  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({
      error: "Password must be between 8 and 72 characters",
    });
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({
      error: "Password must contain at least one letter and one digit",
    });
  }

  try {
    const user = await registerUser(
      normalizedUsername,
      normalizedEmail,
      password
    );

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_ALREADY_EXISTS") {
      return res.status(409).json({
        error: "username or email already exists",
      });
    }


    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}
