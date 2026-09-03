import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "email and password are required",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  const passwordIsValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordIsValid) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  return res.status(200).json({
  message: "Login successful",
  user: {
    id: user.id,
    username: user.username,
    email: user.email,
  },
});
}
