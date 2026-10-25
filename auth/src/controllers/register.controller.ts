import type { Request, Response } from "express";
import { registerUser } from "../services/auth.service";

export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body;

  // 1. Check input types before using string methods.
  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      error: "username, email and password must be strings",
    });
  }

  // 2. Check required fields.
  if (!username.trim() || !email.trim() || !password) {
    return res.status(400).json({
      error: "username, email and password are required",
    });
  }

  // 3. Normalize username and email.
  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // 4. Validate username: 3–20 allowed characters.
  if (!/^[A-Za-z0-9_-]{3,20}$/.test(normalizedUsername)) {
    return res.status(400).json({
      error:
        "Username must be 3-20 characters and contain only letters, numbers, _ or -",
    });
  }

  // 5. Validate email format and maximum length.
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return res.status(400).json({
      error: "Invalid email format",
    });
  }

  // 6. Validate password length.
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({
      error: "Password must be between 8 and 72 characters",
    });
  }

  // 7. Require at least one letter and one digit.
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({
      error: "Password must contain at least one letter and one digit",
    });
  }

  try {
    // 8. Register using the normalized username and email.
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

    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}
