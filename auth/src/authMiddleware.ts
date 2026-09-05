import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const authToken = authHeader.split(" ")[1];

  if (!authToken) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({
      error: "Something went wrong",
    });
  }

  try {
    const decoded = jwt.verify(authToken, jwtSecret);

    console.log(decoded);

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}