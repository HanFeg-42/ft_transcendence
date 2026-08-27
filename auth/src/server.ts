import express from "express";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Auth service is running" });
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: "username, email and password are required",
    });
  }

  return res.status(200).json({
    message: "Registration data received",
    username,
    email,
  });
});

/**
 * valid test
  curl -X POST http://localhost:3001/register \
    -H "Content-Type: application/json" \
    -d '{
      "username": "hanane",
      "email": "hanane@example.com",
      "password": "hello123"
    }'
 */

app.listen(3001, () => {
  console.log("Auth service listening on port http://localhost:3001");
});