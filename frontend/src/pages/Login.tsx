import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Background from "../components/ui/Background";
import NeonFrame from "../components/ui/NeonFrame";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

import type { LoginFormData, LoginResponse } from "../types/auth";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

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

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // If this account uses 2FA, password verification is only step one.
      // Do not store a normal auth token yet.
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setChallengeToken(data.challengeToken);

        setSuccess("");
        setError("");
        return;
      }

      // Account does not use 2FA, so login is complete.
      const loginData: LoginResponse = data;

      login(loginData.user, loginData.token);
      navigate("/home");
    } catch (error) {
      console.error("Login request failed:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit: React.FormEventHandler<
    HTMLFormElement
  > = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (twoFactorCode.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/2fa/verify-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengeToken,
          code: twoFactorCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid authentication code");
        return;
      }

      // Password + second factor are both verified.
      // We can now store the normal authentication token.
      login(data.user, data.token);

      navigate("/home");
    } catch (error) {
      console.error("2FA verification request failed:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequiresTwoFactor(false);
    setChallengeToken("");
    setTwoFactorCode("");
    setError("");
    setSuccess("");
  };

  return (
    <Background>
      <NeonFrame variant="pink" size="md">
        {!requiresTwoFactor ? (
          /*
           * STEP 1:
           * Normal email/password login.
           */
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

            {error && (
              <p className="text-center text-red-500 text-xs">
                {error}
              </p>
            )}

            {success && (
              <p className="text-center text-neon-green text-xs">
                {success}
              </p>
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
              <Link
                to="/signup"
                className="text-neon-green underline"
              >
                Create account
              </Link>
            </p>
          </form>
        ) : (
          /*
           * STEP 2:
           * Password has already been verified.
           * The user must now prove possession of their authenticator.
           */
          <form
            onSubmit={handleTwoFactorSubmit}
            className="flex flex-col gap-5"
            noValidate
          >
            <h1 className="font-display text-neon-pink text-center text-sm tracking-widest">
              • • • SECURITY CHECK • • •
            </h1>

            <div className="text-center flex flex-col gap-2">
              <p className="text-neon-green text-xs font-display">
                ✓ PASSWORD VERIFIED
              </p>

              <p className="text-white/70 text-xs font-body">
                Two-factor authentication is enabled for this account.
              </p>

              <p className="text-white/70 text-xs font-body">
                Enter the 6-digit code from your authenticator app to continue.
              </p>
            </div>

            <Input
              label="Two-Factor Code"
              type="text"
              name="twoFactorCode"
              placeholder="000000"
              value={twoFactorCode}
              onChange={(e) => {
                // Only allow numbers and limit the value to 6 digits.
                const value = e.target.value.replace(/\D/g, "");
                setTwoFactorCode(value.slice(0, 6));
              }}
            />

            {error && (
              <p className="text-center text-red-500 text-xs">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="green"
              styleType="filled"
              disabled={loading || twoFactorCode.length !== 6}
            >
              {loading ? "VERIFYING..." : "VERIFY & LOGIN"}
            </Button>

            <button
              type="button"
              className="text-neon-pink/70 text-xs underline text-center"
              onClick={handleBackToLogin}
              disabled={loading}
            >
              Back to login
            </button>
          </form>
        )}
      </NeonFrame>
    </Background>
  );
}