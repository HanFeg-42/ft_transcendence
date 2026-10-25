import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";

import Background from "../components/ui/Background";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PixelButton from "../components/ui/PixelButton";

import { validateSignUp } from "../utils/validation";
import type { SignUpFormData } from "../types/auth";

/** Renders the account registration form and handles sign-up. */
export default function SignUp() {
  const { t } = useTranslation();

  // validation returns translation keys: turn them into text
  const te = (key?: string) => (key ? t(key) : undefined);

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
        setApiError(data.error || t("signup_errFailed"));
        return;
      }

      navigate("/login");
    } catch (error) {
      console.error("Registration request failed:", error);
      setApiError(t("signup_errServer"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <div className="flex-1 flex items-center justify-center p-4">
        {/* 💡 Card size updated to be compact and fluid (w-[92%] sm:w-full max-w-[360px]) */}
        <Card
          variant="green"
          className="w-[92%] sm:w-full max-w-[460px] mx-auto"
        >
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3" // 💡 Reduced gap from 4 to 3 to keep layout short
            noValidate
          >
            {/* Retro Header */}
            <div className="text-center mb-1">
              <h1 className="font-pixelify text-pacova-green text-xl tracking-wider uppercase">
                ▼ {t("signup_title")} ▼
              </h1>
            </div>

            {/* Form Fields */}
            <Input
              label={t("signup_username")}
              type="text"
              name="username"
              placeholder={t("signup_usernamePlaceholder")}
              value={formData.username}
              onChange={handleChange}
              error={te(errors.username)}
            />

            <Input
              label={t("signup_email")}
              type="email"
              name="email"
              placeholder={t("signup_passwordPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              error={te(errors.email)}
            />

            <Input
              label={t("signup_password")}
              type="password"
              name="password"
              placeholder={t("signup_passwordPlaceholder")}
              value={formData.password}
              onChange={handleChange}
              error={te(errors.password)}
            />

            <Input
              label={t("signup_confirmPassword")}
              type="password"
              name="confirmPassword"
              placeholder={t("signup_confirmPlaceholder")}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={te(errors.confirmPassword)}
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
              {loading ? t("signup_creating") : t("signup_button")}
            </PixelButton>

            <p className="mt-3 text-center text-sm text-gray-400">
              <Trans
                i18nKey="signup_consent"
                components={{
                  terms: (
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pacova-green underline"
                    />
                  ),
                  privacy: (
                    <Link
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pacova-green underline"
                    />
                  ),
                }}
              />
            </p>

            {/* Footer Navigation Link */}
            <div className="text-center border-t border-pacova-green/30 pt-3 mt-1 font-vt323 text-sm">
              {" "}
              {/* 💡 Reduced text size to text-sm and compact padding */}
              <span className="text-gray-400">{t("signup_alreadyHave")} </span>
              <Link
                to="/login"
                className="text-pacova-pink hover:underline uppercase tracking-wide"
              >
                {t("signup_login")}
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </Background>
  );
}
