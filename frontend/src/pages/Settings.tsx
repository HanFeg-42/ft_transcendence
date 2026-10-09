import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import i18n from "../i18n";
import { useAuth } from "../context/AuthContext";

import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
import Card from "../components/ui/Card";
import PixelButton from "../components/ui/PixelButton";
import TwoFactorSetup from "../components/TwoFactorSetup";

import accountIcon_green from "../assets/icons/user (2).png";

const routeMap: Record<string, string> = {
  HOME: "/home",
  PROFILE: "/profile",
  CHAT: "/chat",
  NOTIFICATION: "/notifications",
  SETTINGS: "/settings",
};

export default function Settings() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  const [friendRequests, setFriendRequests] = useState(true);
  const [gameInvitations, setGameInvitations] = useState(true);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [language, setLanguage] = useState(i18n.language);

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];

    if (path) {
      navigate(path);
    }
  };

  const handleLanguageChange = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    i18n.changeLanguage(selectedLanguage);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
      navigate("/login");
    } catch {
      setLogoutError("Logout failed. Please try again.");
      setIsLoggingOut(false);
    }
  };

  const sectionTitle =
    "font-press-start text-sm text-pacova-green";

  const description =
    "mt-3 font-vt323 text-lg text-pacova-gray";

  const actionButton =
    "border border-pacova-green px-4 py-2 " +
    "font-vt323 text-lg text-pacova-green " +
    "transition hover:bg-pacova-green hover:text-black " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Background>
      <Navbar
        activeTab="SETTINGS"
        onSelectTab={handleSelectTab}
      />

      <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 sm:p-6">
        <div className="grid w-full grid-cols-1 gap-5">

          {/* ACCOUNT */}
          <section id="account">
            <Card variant="gray" className="p-5 md:p-6">
              <div className="relative min-h-[430px] overflow-hidden">

                {/* Account header */}
                <div className="relative z-10 mb-5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-2 w-2 bg-pacova-green shadow-[0_0_8px_#8ED603]" />

                    <span className="font-vt323 text-lg uppercase tracking-widest text-pacova-green">
                      ACCOUNT / PLAYER
                    </span>
                  </div>

                  <h2 className="font-pixelify text-3xl uppercase tracking-wider text-pacova-green sm:text-4xl">
                    YOUR PROFILE
                  </h2>

                  <p className="mt-1 font-vt323 text-xl text-gray-400">
                    Manage your identity and player information.
                  </p>
                </div>

                {/* Main profile panel */}
                <div
                  className="
                    relative overflow-hidden
                    border-2 border-pacova-green/50
                    bg-[#0D0914]/90 p-4
                    shadow-[0_0_20px_rgba(142,214,3,0.10)]
                  "
                >
                  {/* Green corner decorations */}
                  <span className="absolute left-0 top-0 h-[2px] w-20 bg-pacova-green shadow-[0_0_8px_#8ED603]" />
                  <span className="absolute right-0 top-0 h-[2px] w-12 bg-pacova-green shadow-[0_0_8px_#8ED603]" />
                  <span className="absolute bottom-0 right-0 h-[2px] w-20 bg-pacova-green shadow-[0_0_8px_#8ED603]" />

                  {/* Profile identity */}
                  <div className="flex flex-col items-center gap-6 md:flex-row">

                    {/* Avatar frame - kept from the old design */}
                    <div
                      className="
                        relative flex h-32 w-32 shrink-0
                        items-center justify-center
                        rounded-lg border-2 border-pacova-green
                        shadow-[0_0_20px_rgba(142,214,3,0.20)]
                        sm:h-36 sm:w-36
                      "
                    >
                      <div className="relative h-24 w-24">
                        <img
                          src={accountIcon_green}
                          alt="Profile avatar"
                          className="h-full w-full object-contain"
                        />

                        {/* Pixel corners */}
                        <span className="absolute left-0 top-0 h-5 w-5 border-l-[3px] border-t-[3px] border-pacova-green" />
                        <span className="absolute right-0 top-0 h-5 w-5 border-r-[3px] border-t-[3px] border-pacova-green" />
                        <span className="absolute bottom-0 left-0 h-5 w-5 border-b-[3px] border-l-[3px] border-pacova-green" />
                        <span className="absolute bottom-0 right-0 h-5 w-5 border-b-[3px] border-r-[3px] border-pacova-green" />
                      </div>
                    </div>

                    {/* Username and status */}
                    <div className="min-w-0 flex-1 text-center md:text-left">
                      <span className="mb-1 inline-block font-vt323 text-lg uppercase tracking-widest text-pacova-green">
                        PLAYER ID
                      </span>

                      <h3 className="break-words font-pixelify text-2xl uppercase text-white sm:text-3xl">
                        {user?.username || "PLAYER"}
                      </h3>

                      <p className="mt-1 font-vt323 text-xl text-gray-400">
                        Your account information
                      </p>

                      <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                        <span className="rounded-lg border border-pacova-green px-2 py-1 font-vt323 text-pacova-green">
                          ● ONLINE
                        </span>

                        <span className="rounded-lg border border-pacova-green/40 px-2 py-1 font-vt323 text-gray-400">
                          PACOVA PLAYER
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Username and email */}
                  <div className="mt-8 grid grid-cols-1 gap-4 border-t border-pacova-gray/40 pt-5 sm:grid-cols-2">

                    <div className="min-w-0">
                      <p className="font-vt323 text-lg uppercase text-gray-500">
                        Username
                      </p>

                      <p className="break-words font-vt323 text-xl text-white">
                        {user?.username || "Not available"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="font-vt323 text-lg uppercase text-gray-500">
                        Email
                      </p>

                      <p className="break-all font-vt323 text-xl text-white">
                        {user?.email || "No email available"}
                      </p>
                    </div>
                  </div>

                  {/* Edit profile action */}
                  <div
                    className="
                      mt-6 flex flex-col items-start gap-4
                      border-t border-pacova-gray/40 pt-5
                      sm:flex-row sm:items-center sm:justify-between
                    "
                  >
                    <p className="font-vt323 text-lg text-gray-500">
                      Keep your player profile up to date.
                    </p>

                    <PixelButton
                      variant="outline-green"
                      onClick={() => navigate("/profile")}
                      className="w-full sm:w-64"
                    >
                      EDIT PROFILE →
                    </PixelButton>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* SECURITY */}
          <section id="security">
            <Card variant="gray" className="p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={sectionTitle}>SECURITY</h2>

                  <p className={description}>
                    Protect your account with two-factor authentication.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTwoFactor((current) => !current)}
                  aria-expanded={showTwoFactor}
                  className={actionButton}
                >
                  {showTwoFactor ? "CLOSE 2FA" : "MANAGE 2FA"}
                </button>
              </div>

              {showTwoFactor && (
                <div className="mt-5 border-t border-pacova-gray/40 pt-5">
                  <TwoFactorSetup />
                </div>
              )}

              {/* Logout */}
              <div className="mt-5 flex flex-col items-start gap-3 border-t border-pacova-gray/40 pt-5">
                <PixelButton
                  onClick={handleLogout}
                  variant="danger-red"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "LOGGING OUT..." : "LOGOUT"}
                </PixelButton>

                {logoutError && (
                  <p role="alert" className="font-vt323 text-lg text-red-400">
                    {logoutError}
                  </p>
                )}
              </div>
            </Card>
          </section>

          {/* PREFERENCES */}
          <section id="preferences">
            <Card variant="gray" className="p-5 md:p-6">
              <div className="mb-5">
                <h2 className={sectionTitle}>PREFERENCES</h2>

                <p className={description}>
                  Choose which notifications you want to receive.
                </p>
              </div>

              {/* Friend requests */}
              <div className="flex items-center justify-between gap-4 border-t border-pacova-gray/40 py-5">
                <div>
                  <h3 className="font-pixelify text-sm text-pacova-green">
                    FRIEND REQUESTS
                  </h3>

                  <p className="mt-1 font-vt323 text-base text-pacova-gray">
                    When someone sends you a friend request.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={friendRequests}
                  aria-label="Friend request notifications"
                  onClick={() => setFriendRequests((value) => !value)}
                  className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                    friendRequests
                      ? "border-pacova-green bg-pacova-green/30"
                      : "border-pacova-gray bg-pacova-gray/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                      friendRequests
                        ? "left-[22px] bg-pacova-green"
                        : "left-0.5 bg-pacova-gray"
                    }`}
                  />
                </button>
              </div>

              {/* Game invitations */}
              <div className="flex items-center justify-between gap-4 border-t border-pacova-gray/40 py-5">
                <div>
                  <h3 className="font-pixelify text-sm text-pacova-green">
                    GAME INVITATIONS
                  </h3>

                  <p className="mt-1 font-vt323 text-base text-pacova-gray">
                    When someone invites you to play.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={gameInvitations}
                  aria-label="Game invitation notifications"
                  onClick={() => setGameInvitations((value) => !value)}
                  className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                    gameInvitations
                      ? "border-pacova-green bg-pacova-green/30"
                      : "border-pacova-gray bg-pacova-gray/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                      gameInvitations
                        ? "left-[22px] bg-pacova-green"
                        : "left-0.5 bg-pacova-gray"
                    }`}
                  />
                </button>
              </div>
            </Card>
          </section>

          {/* APPEARANCE */}
          <section id="appearance">
            <Card variant="gray" className="p-5 md:p-6">
              <div className="mb-5">
                <h2 className={sectionTitle}>APPEARANCE</h2>

                <p className={description}>
                  Your interface colors
                </p>
              </div>

              <div className="border-t border-pacova-gray/40 pt-5">
                <h3 className="font-vt323 text-xl text-white">
                  Pacova Neon
                </h3>

                <p className="font-vt323 text-base text-pacova-gray">
                  Dark background with green accents
                </p>
              </div>

              {/* PACOVA palette without pink */}
              <div className="mt-5 flex gap-2">
                <div
                  className="h-8 flex-1 rounded-sm bg-[#0D0914]"
                  title="Background"
                />

                <div
                  className="h-8 flex-1 rounded-sm bg-[#510950]"
                  title="Purple"
                />

                <div
                  className="h-8 flex-1 rounded-sm bg-[#8ED603]"
                  title="Green"
                />

                <div
                  className="h-8 flex-1 rounded-sm bg-[#464446]"
                  title="Gray"
                />
              </div>
            </Card>
          </section>

          {/* LANGUAGE */}
          <section id="language">
            <Card variant="gray" className="p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={sectionTitle}>
                    {t("language.title", "LANGUAGE")}
                  </h2>

                  <p className={description}>
                    {t("language.description", "Choose your interface language.")}
                  </p>
                </div>

                <select
                  aria-label="Interface language"
                  value={language}
                  onChange={(event) =>
                    handleLanguageChange(event.target.value)
                  }
                  className="
                    border border-pacova-green
                    bg-pacova-bg px-4 py-3
                    font-vt323 text-lg text-pacova-green
                    outline-none focus:ring-2 focus:ring-pacova-green
                  "
                >
                  <option value="en">ENGLISH</option>
                  <option value="fr">FRANÇAIS</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </Card>
          </section>

        </div>
      </main>
    </Background>
  );
}