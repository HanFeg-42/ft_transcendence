import express from "express";
import { register } from "./registerController";

const app = express();

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