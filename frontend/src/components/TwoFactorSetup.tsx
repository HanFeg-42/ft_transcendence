import { useState } from "react";
import PixelButton from "./ui/PixelButton";
import Input from "./ui/Input";
import Card from "./ui/Card";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function TwoFactorSetup() {
  const { token, user, verifyUser } = useAuth();

  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSetup = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("setupFailed"));
        return;
      }

      setQrCode(data.qrCode);
    } catch (error) {
      console.error("2FA setup failed:", error);
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError(t("invalidCode"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/2fa/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error === "Invalid 2FA code"
            ? t("invalidAuthentication")
            : data.error || t("invalidAuthenticationCode")
        );
        return;
      }
      await verifyUser();

      setQrCode("");
      setCode("");
    } catch (error) {
      console.error("2FA confirmation failed:", error);
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("disableFailed"));
        return;
      }

      const verified = await verifyUser();

      if (!verified) {
        setError(t("disableRefreshError"));
        return;
      }
    } catch (error) {
      console.error(t("disableFailed"), error);
      setError(t("connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="green" className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-pixelify text-pacova-green text-lg uppercase tracking-widest">
            {t("accountSecurity")}
          </h2>

          <p className="font-vt323 text-gray-400 text-lg mt-1">
            {t("description")}
          </p>
        </div>

        <span
          className={`font-vt323 text-lg uppercase ${
            user?.twoFactorEnabled ? "text-pacova-green" : "text-yellow-400"
          }`}
        >
          {user?.twoFactorEnabled ? t("protected") : t("notProtected")}
        </span>
      </div>

      {user?.twoFactorEnabled ? (
        <div className="border border-pacova-green/30 p-4 rounded">
          <p className="text-pacova-green text-center font-pixelify text-sm uppercase">
            {t("enabled")}
          </p>

          <p className="font-vt323 text-gray-400 text-center text-lg mt-2">
            {t("enabledDescription")}
          </p>

          <PixelButton
            type="button"
            variant="filled-green"
            size="md"
            disabled={loading}
            onClick={handleDisable}
            className="w-full mt-4"
          >
            {loading ? t("disabling") : t("disable")}
          </PixelButton>
        </div>
      ) : !qrCode ? (
        <>
          <div className="font-vt323 text-gray-300 text-lg leading-6 mb-4">
            <p>{t("step1")}</p>
            <p>{t("step2")}</p>
            <p>{t("step3")}</p>
          </div>

          <PixelButton
            type="button"
            variant="filled-green"
            size="md"
            disabled={loading}
            onClick={handleSetup}
            className="w-full"
          >
            {loading ? t("generating") : t("enable")}
          </PixelButton>
        </>
      ) : (
        <form onSubmit={handleConfirm} className="flex flex-col gap-5">
          <div className="text-center font-vt323">
            <p className="text-pacova-pink text-lg uppercase">
              {t("scanQrCode")}
            </p>

            <p className="text-gray-400 text-lg mt-2">
              {t("authenticatorApps")}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-3">
              <img
                src={qrCode}
                alt="Pacova 2FA QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>

          <div className="text-center font-vt323">
            <p className="text-pacova-pink text-lg uppercase">
              {t("verify")}
            </p>

            <p className="text-gray-400 text-lg mt-2">
              {t("enterCode")}
            </p>
          </div>

          <Input
            label={t("authenticationCode")}
            type="text"
            name="twoFactorCode"
            placeholder="000000"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setCode(value.slice(0, 6));
            }}
          />

          {error && (
            <p className="font-vt323 text-red-500 text-lg text-center uppercase">
              ⚠️ {error}
            </p>
          )}

          <PixelButton
            type="submit"
            variant="filled-green"
            size="md"
            disabled={loading || code.length !== 6}
            className="w-full"
          >
            {loading ? t("verifying") : t("confirmEnable")}
          </PixelButton>

          <button
            type="button"
            onClick={() => {
              setQrCode("");
              setCode("");
              setError("");
            }}
            className="font-vt323 text-gray-400 text-lg underline text-center"
          >
            {t("cancelSetup")}
          </button>
        </form>
      )}

      {error && !qrCode && (
        <p className="font-vt323 text-red-500 text-lg text-center uppercase">
          ⚠️ {error}
        </p>
      )}
    </Card>
  );
}