import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

export function requireInternalKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.INTERNAL_API_KEY;

  if (!expected) {
    console.error("INTERNAL_API_KEY is not configured");
    return res.status(500).json({ error: "Something went wrong" });
  }

  const provided = req.header("x-internal-key");
  if (!provided) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}