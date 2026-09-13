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

  // 2FA state
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

      // If 2FA is enabled, password verification is only step one.
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setChallengeToken(data.challengeToken);

        setSuccess("");
        setError("");

        return;
      }

      // No 2FA → login is complete
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

  // 2FA verification
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

      // Password + 2FA verified
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

  // 42 OAuth
  const handle42Login = () => {
    window.location.href = "https://localhost:443/api/auth/42/login";
  };

  return (
    <Background>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card variant="pink" className="max-w-xl w-full p-6">
          {!requiresTwoFactor ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
              noValidate
            >
              {/* Header */}
              <div className="text-center mb-2">
                <h1 className="font-pixelify text-pacova-pink text-2xl tracking-wider uppercase">
                  ▼ ▼ LOGIN ▼ ▼
                </h1>
              </div>

              {/* Email */}
              <Input
                label="EMAIL"
                type="email"
                name="email"
                placeholder="Enter your email..."
                value={formData.email}
                onChange={handleChange}
              />

              {/* Password */}
              <Input
                label="PASSWORD"
                type="password"
                name="password"
                placeholder="Enter your password..."
                value={formData.password}
                onChange={handleChange}
              />

              {/* Error */}
              {error && (
                <p className="text-center font-vt323 text-red-500 text-lg uppercase tracking-wide">
                  ⚠️ {error}
                </p>
              )}

              {/* Success */}
              {success && (
                <p className="text-center font-vt323 text-pacova-green text-lg uppercase tracking-wide">
                  ✓ {success}
                </p>
              )}

              {/* Normal Login */}
              <PixelButton
                type="submit"
                variant="filled-pink"
                size="md"
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? "LOGGING IN..." : "LOGIN"}
              </PixelButton>

              {/* Divider */}
              <div className="flex items-center my-1">
                <div className="flex-1 border-t border-pacova-pink/30"></div>

                <span className="px-3 font-vt323 text-gray-400 text-base">
                  OR
                </span>

                <div className="flex-1 border-t border-pacova-pink/30"></div>
              </div>

              {/* 42 OAuth */}
              <PixelButton
                type="button"
                variant="olive-yellow"
                size="md"
                onClick={handle42Login}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3"
              >
                <span>CONTINUE WITH 42</span>
              </PixelButton>

              {/* Sign up */}
              <div className="text-center border-t border-pacova-pink/30 pt-4 mt-2 font-vt323 text-lg">
                <span className="text-gray-400">
                  DON'T HAVE AN ACCOUNT?{" "}
                </span>

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
              {/* 2FA Header */}
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

              {/* 2FA Code */}
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

              {/* Verify 2FA */}
              <PixelButton
                type="submit"
                variant="filled-pink"
                size="md"
                disabled={loading || twoFactorCode.length !== 6}
                className="w-full mt-6"
              >
                {loading ? "VERIFYING..." : "VERIFY & LOGIN"}
              </PixelButton>

              {/* Back */}
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