import type { Request, Response } from "express";
import { loginUser } from "../services/auth.service";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "email and password are required",
    });
  }

  try {
    const result = await loginUser(email, password, res);

    if (result.requiresTwoFactor) {
      return res.status(200).json({
        message: "2FA verification required",
        requiresTwoFactor: true,
        challengeToken: result.challengeToken,
      });
    }

    return res.status(200).json({
      message: "Login successful",
      requiresTwoFactor: false,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      if (
        error.message === "JWT_SECRET_NOT_CONFIGURED" ||
        error.message === "TWO_FACTOR_CHALLENGE_SECRET_NOT_CONFIGURED"
      ) {
        console.error(error.message);

        return res.status(500).json({
          error: "Something went wrong",
        });
      }
    }

    console.error(error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
}