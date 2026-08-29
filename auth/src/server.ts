import express from "express";
import { register } from "./registerController";
import cors from 'cors'

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
}))

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Auth service is running",
  });
});

app.post("/register", register);

app.listen(3001, () => {
  console.log("Auth service listening on port http://localhost:3001");
});