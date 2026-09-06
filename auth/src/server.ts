import express from "express";
import { register } from "./registerController";
import { login } from "./loginController";
import cors from "cors";
import { authenticateToken } from "./authMiddleware";
import type { AuthenticatedRequest } from "./types/auth";
import { prisma } from "./prisma";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Auth service is running",
  });
});

app.post("/register", register);
app.post("/login", login);

app.get("/me", authenticateToken, async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(401).json({
      error: "Authentication invalid",
    });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

app.listen(3001, () => {
  console.log("Auth service listening on port http://localhost:3001");
});
