import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Background from "../components/ui/Background";
import NeonFrame from "../components/ui/NeonFrame";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

import type { LoginFormData, LoginResponse } from "../types/auth";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  // Stores the email and password entered by the user
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  // Message displayed when login fails
  const [error, setError] = useState("");

  // Message displayed when login succeeds
  const [success, setSuccess] = useState("");

  // True while we are waiting for the backend response
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    // Clear messages from the previous attempt
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      // Convert the JSON response into a JavaScript object
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Login succeeded
      const loginData: LoginResponse = data;

      login(loginData.user, loginData.token);
      setSuccess("Logged in successfully");
      navigate("/home");
      console.log("Logged in user:", loginData.user);
    } catch (error) {
      console.error("Login request failed:", error);

      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <NeonFrame variant="pink" size="md">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
          noValidate
        >
          <h1 className="font-display text-neon-pink text-center text-sm tracking-widest">
            • • • LOGIN • • •
          </h1>

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email..."
            value={formData.email}
            onChange={handleChange}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password..."
            value={formData.password}
            onChange={handleChange}
          />

          {/* Backend/login error */}
          {error && <p className="text-center text-red-500 text-xs">{error}</p>}

          {/* Successful login */}
          {success && (
            <p className="text-center text-neon-green text-xs">{success}</p>
          )}

          <Button
            type="submit"
            variant="green"
            styleType="filled"
            disabled={loading}
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </Button>

          <p className="text-center text-neon-pink/70 text-xs font-body">
            Don't have an account?{" "}
            <Link to="/signup" className="text-neon-green underline">
              Create account
            </Link>
          </p>
        </form>
      </NeonFrame>
    </Background>
  );
}
