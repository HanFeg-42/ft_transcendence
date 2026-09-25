import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  console.log("[AUTH] Request reached auth middleware!");

  const authHeader = req.headers.authorization;

  console.log("[AUTH] authHeader is ", authHeader);

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

    req.headers["x-user-id"] = String(decoded.userId);

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}
