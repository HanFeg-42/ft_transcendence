import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "./types/auth";

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
    const decoded = jwt.verify(authToken, jwtSecret, {
      algorithms: ["HS256"],
    });

    if (typeof decoded === "string" || typeof decoded.userId !== "number") {
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    (req as AuthenticatedRequest).userId = decoded.userId;

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}
