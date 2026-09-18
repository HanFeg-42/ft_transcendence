import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Background from "../components/ui/Background";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";

import type { LoginFormData, LoginResponse } from "../types/auth";
import { useAuth } from "../context/AuthContext";

/** Renders the login form and handles user authentication. */
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
        {/* Largeur max ajustée à 360px pour un format plus compact et moins étiré */}
        <Card variant="pink" className="w-[92%] sm:w-full max-w-[360px] mx-auto">
          {!requiresTwoFactor ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3.5" // 💡 Réduit de gap-5 à gap-3.5 pour tasser la hauteur
              noValidate
            >
              {/* Header */}
              <div className="text-center mb-1">
                <h1 className="font-pixelify text-pacova-pink text-xl tracking-wider uppercase">
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
                <p className="text-center font-vt323 text-red-500 text-base uppercase tracking-wide">
                  ⚠️ {error}
                </p>
              )}

              {/* Success */}
              {success && (
                <p className="text-center font-vt323 text-pacova-green text-base uppercase tracking-wide">
                  ✓ {success}
                </p>
              )}

              {/* Normal Login */}
              <PixelButton
                type="submit"
                variant="filled-pink"
                size="md"
                disabled={loading}
                className="w-full max-w-[180px] sm:max-w-[220px] mx-auto mt-2" // 💡 mt-4 -> mt-2 et taille max réduite pour équilibrer
              >
                {loading ? "LOGGING IN..." : "LOGIN"}
              </PixelButton>

              {/* Divider */}
              <div className="flex items-center my-0.5"> {/* 💡 my-1 -> my-0.5 */}
                <div className="flex-1 border-t border-pacova-pink/30"></div>
                <span className="px-3 font-vt323 text-gray-400 text-sm">OR</span>
                <div className="flex-1 border-t border-pacova-pink/30"></div>
              </div>

              {/* 42 OAuth */}
              <PixelButton
                type="button"
                variant="olive-yellow"
                size="md"
                onClick={handle42Login}
                disabled={loading}
                className="w-full max-w-[180px] sm:max-w-[220px] mx-auto mt-0.5" // 💡 mt-4 -> mt-0.5
              >
                <span>CONTINUE WITH 42</span>
              </PixelButton>

              {/* Sign up */}
              <div className="text-center border-t border-pacova-pink/30 pt-3 mt-1 font-vt323 text-sm">
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
              className="flex flex-col gap-3.5" // 💡 Même structure compacte appliquée au 2FA
              noValidate
            >
              {/* 2FA Header */}
              <div className="text-center mb-1">
                <h1 className="font-pixelify text-pacova-pink text-xl tracking-wider uppercase">
                  ▼ ▼ SECURITY ▼ ▼
                </h1>
              </div>

              <div className="text-center flex flex-col gap-1 font-vt323 leading-tight">
                <p className="text-pacova-green text-base uppercase">
                  ✓ Password verified
                </p>
                <p className="text-gray-400 text-sm">
                  Enter the 6-digit code from your authenticator app to continue.
                </p>
              </div>

              {/* 2FA Code */}
              <Input
                label="TWO-FACTOR CODE"
                type="text"
                name="twoFactorCode"
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
              />

              {/* Error */}
              {error && (
                <p className="text-center font-vt323 text-red-500 text-base uppercase tracking-wide">
                  ⚠️ {error}
                </p>
              )}

              {/* Verify Button */}
              <PixelButton
                type="submit"
                variant="filled-pink"
                size="md"
                disabled={loading}
                className="w-full max-w-[180px] sm:max-w-[220px] mx-auto mt-2"
              >
                {loading ? "VERIFYING..." : "VERIFY CODE"}
              </PixelButton>

              {/* Retour au login */}
              <div className="text-center border-t border-pacova-pink/30 pt-3 mt-1 font-vt323 text-base">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-gray-400 hover:text-pacova-pink hover:underline uppercase tracking-wide cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </Background>
  );
}
