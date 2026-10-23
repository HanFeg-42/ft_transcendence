import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
// import TwoFactorSetup from "../components/TwoFactorSetup";
import PixelButton from "../components/ui/PixelButton";

const routeMap: Record<string, string> = {
  HOME: "/home",
  LEADERBOARD: "/leaderboard",
  PROFILE: "/profile",
  CHAT: "/chat",
  NOTIFICATION: "/notifications",
  SETTINGS: "/settings",
};

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLogoutError(t("logoutError"));
      // "Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) {
      navigate(path);
    }
  };

  return (
    <Background>
      <Navbar activeTab="HOME" onSelectTab={handleSelectTab} />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col gap-6">
        <h1 className="font-pixelify text-pacova-pink text-3xl uppercase">
          {t("dashboard")}
          {/* Pacova Dashboard - add translate*/}
        </h1>

        <p className="font-vt323 text-gray-300 text-xl">
          {t("welcome", { username: user?.username ?? "" })}
          {/* Welcome, {user?.username}! - add translate */}
        </p>

        {/* <TwoFactorSetup /> */}

        <PixelButton
          variant="filled-pink"
          size="lg"
          onClick={() => navigate("/choose")}
          className="self-start"
        >
          {t("playNow")}
          {/* PLAY NOW - add translate */}
        </PixelButton>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="font-vt323 text-pacova-pink text-lg underline self-start uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? t("loggingOut") : t("logout")}
          {/* {isLoggingOut ? "Logging out..." : "Logout"} - add translate */}
        </button>

        {logoutError && (
          <p className="font-vt323 text-red-400 text-lg">{logoutError}</p>
        )}
      </main>
    </Background>
  );
}
