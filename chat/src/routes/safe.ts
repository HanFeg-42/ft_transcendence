import { Request, Response } from "express";

export const safe =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response): void => {
    fn(req, res).catch((err) => {
      console.error("[CHAT] route error:", err);
      if (!res.headersSent)
        res.status(500).json({ error: "Internal server error" });
    });
  };
