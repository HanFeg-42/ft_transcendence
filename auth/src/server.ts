import express from "express";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Auth service is running" });
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  res.status(200).json({
    username,
    email,
    password,
  });
});

app.listen(3001, () => {
  console.log("Auth service listening on port http://localhost:3001");
});