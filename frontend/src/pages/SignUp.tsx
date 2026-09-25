import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Background from "../components/ui/Background";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";

import { validateSignUp } from "../utils/validation";
import type { SignUpFormData } from "../types/auth";

/** Renders the account registration form and handles sign-up. */
export default function SignUp() {
  const [formData, setFormData] = useState<SignUpFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Validation errors for individual form fields
  const [errors, setErrors] = useState<Record<string, string>>({});

  // General error coming from the backend
  const [apiError, setApiError] = useState("");

  // Used to disable the button while waiting for the backend response
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    // Clear the previous backend error
    setApiError("");

    const validationErrors = validateSignUp(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || "Registration failed");
        return;
      }

      navigate("/login");
    } catch (error) {
      console.error("Registration request failed:", error);
      setApiError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <div className="flex-1 flex items-center justify-center p-4">
        {/* 💡 Card size updated to be compact and fluid (w-[92%] sm:w-full max-w-[360px]) */}
        <Card variant="green" className="w-[92%] sm:w-full max-w-[460px] mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3" // 💡 Reduced gap from 4 to 3 to keep layout short
            noValidate
          >
            {/* Retro Header */}
            <div className="text-center mb-1">
              <h1 className="font-pixelify text-pacova-green text-xl tracking-wider uppercase">
                ▼ ▼ CREATE ACCOUNT ▼ ▼
              </h1>
            </div>

            {/* Form Fields */}
            <Input
              label="USERNAME"
              type="text"
              name="username"
              placeholder="Enter your username..."
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
            />

            <Input
              label="EMAIL"
              type="email"
              name="email"
              placeholder="Enter your email..."
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              label="PASSWORD"
              type="password"
              name="password"
              placeholder="Enter your password..."
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            <Input
              label="CONFIRM PASSWORD"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password..."
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            {/* Backend Error Message */}
            {apiError && (
              <p className="text-center font-vt323 text-red-500 text-base uppercase tracking-wide">
                ⚠️ {apiError}
              </p>
            )}

            {/* Centered Pixel Submit Button */}
            <PixelButton
              type="submit"
              variant="filled-green"
              size="lg"
              disabled={loading}
              className="w-full max-w-[180px] sm:max-w-[220px] mx-auto mt-2" // 💡 Changed to centered layout with less top margin
            >
              {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
            </PixelButton>

            {/* Footer Navigation Link */}
            <div className="text-center border-t border-pacova-green/30 pt-3 mt-1 font-vt323 text-sm"> {/* 💡 Reduced text size to text-sm and compact padding */}
              <span className="text-gray-400">
                ALREADY HAVE AN ACCOUNT?{" "}
              </span>
              <Link
                to="/login"
                className="text-pacova-pink hover:underline uppercase tracking-wide"
              >
                LOGIN
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </Background>
  );
}
