import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Background from "../components/ui/Background";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";

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

  const handleTwoFactorSubmit: React.FormEventHandler<HTMLFormElement> = async (
    e,
  ) => {
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
      <div className="flex-1 flex items-center justify-center p-4">
        <Card variant="pink" className="max-w-xl w-full p-6">
          {!requiresTwoFactor ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6"
              noValidate
            >
              <div className="text-center mb-2">
                <h1 className="font-pixelify text-pacova-pink text-2xl tracking-wider uppercase">
                  ▼ ▼ LOGIN ▼ ▼
                </h1>
              </div>

              <Input
                label="EMAIL"
                type="email"
                name="email"
                placeholder="Enter your email..."
                value={formData.email}
                onChange={handleChange}
              />

              <Input
                label="PASSWORD"
                type="password"
                name="password"
                placeholder="Enter your password..."
                value={formData.password}
                onChange={handleChange}
              />

              {error && (
                <p className="text-center font-vt323 text-red-500 text-lg uppercase tracking-wide">
                  ⚠️ {error}
                </p>
              )}

              {success && (
                <p className="text-center font-vt323 text-pacova-green text-lg uppercase tracking-wide">
                  ✓ {success}
                </p>
              )}

              <PixelButton
                type="submit"
                variant="filled-pink"
                size="md"
                disabled={loading}
                className="w-full mt-6"
              >
                {loading ? "LOGGING IN..." : "LOGIN"}
              </PixelButton>

              <div className="text-center border-t border-pacova-pink/30 pt-4 mt-2 font-vt323 text-lg">
                <span className="text-gray-400">DON'T HAVE AN ACCOUNT? </span>
                <Link
                  to="/signup"
                  className="text-pacova-green hover:underline uppercase tracking-wide"
                >
                  CREATE ACCOUNT
                </Link>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleTwoFactorSubmit}
              className="flex flex-col gap-6"
              noValidate
            >
              <div className="text-center mb-2">
                <h1 className="font-pixelify text-pacova-pink text-2xl tracking-wider uppercase">
                  ▼ ▼ SECURITY CHECK ▼ ▼
                </h1>
              </div>

              <div className="text-center flex flex-col gap-2 font-vt323">
                <p className="text-pacova-green text-lg uppercase">
                  ✓ Password verified
                </p>
                <p className="text-gray-400 text-lg">
                  Two-factor authentication is enabled for this account.
                </p>
                <p className="text-gray-400 text-lg">
                  Enter the 6-digit code from your authenticator app to
                  continue.
                </p>
              </div>

              <Input
                label="TWO-FACTOR CODE"
                type="text"
                name="twoFactorCode"
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setTwoFactorCode(value.slice(0, 6));
                }}
              />

              {error && (
                <p className="text-center font-vt323 text-red-500 text-lg uppercase tracking-wide">
                  ⚠️ {error}
                </p>
              )}

              <PixelButton
                type="submit"
                variant="filled-pink"
                size="md"
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full mt-6"
              >
                {loading ? "VERIFYING..." : "VERIFY & LOGIN"}
              </PixelButton>

              <button
                type="button"
                className="text-pacova-pink/70 text-lg underline text-center font-vt323"
                onClick={handleBackToLogin}
                disabled={loading}
              >
                Back to login
              </button>
            </form>
          )}
        </Card>
      </div>
    </Background>
  );
}
