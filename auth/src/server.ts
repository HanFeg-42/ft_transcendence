import express from "express";
import { register } from "./registerController";
import { login } from "./loginController";
import cors from "cors";
import { authenticateToken } from "./authMiddleware";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Auth service is running",
  });
});

app.post("/register", register);
app.post("/login", login);

app.get("/me", authenticateToken, (_req, res) => {
  res.status(200).json({
    message: "You are authenticated",
  });
});

app.listen(3001, () => {
  console.log("Auth service listening on port http://localhost:3001");
});