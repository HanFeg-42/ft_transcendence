import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import i18n from "../i18n";
import { getMyProfile, type ProfileData } from "../services/userService";
import { useAuth } from "../context/AuthContext";

import TwoFactorSetup from "../components/TwoFactorSetup";
import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
import Card from "../components/ui/Card";
import PixelButton from "../components/ui/PixelButton";

import accountIcon_green from "../assets/icons/user.png";
import securityIcon from "../assets/icons/sc.png";
import appearanceIcon from "../assets/icons/app.png";
import languageIcon from "../assets/icons/lang.png";

const routeMap: Record<string, string> = {
  HOME: "/home",
  LEADERBOARD: "/leaderboard",
  PROFILE: "/profile",
  CHAT: "/chat",
  NOTIFICATION: "/notifications",
  SETTINGS: "/settings",
};

const settingsSections = [
  { name: "ACCOUNT", image: accountIcon_green, color: "green" },
  { name: "SECURITY", image: securityIcon, color: "yellow" },
  { name: "APPEARANCE", image: appearanceIcon, color: "purple" },
  { name: "LANGUAGE", image: languageIcon, color: "blue" },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const { t } = useTranslation();

  const [activeSection, setActiveSection] = useState("ACCOUNT");
  const [showMobileSections, setShowMobileSections] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [language, setLanguage] = useState(
    i18n.resolvedLanguage?.split("-")[0] || "en"
  );
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  // Read the theme that is already used by Background.tsx.
  const [themeMode, setThemeMode] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("pacova-theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    if (!token) return;

    getMyProfile(token)
      .then(setProfile)
      .catch((error) => {
        console.error("Failed to load profile:", error);
      });
  }, [token]);

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];

    if (path) navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLanguageChange = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    void i18n.changeLanguage(selectedLanguage);
  };

const handleThemeChange = (selectedTheme: "dark" | "light") => {
  if (selectedTheme === themeMode) return;

  try {
    localStorage.setItem("pacova-theme", selectedTheme);
  } catch {
    // Theme can still change for this session.
  }

  window.dispatchEvent(new Event("pacova-theme-change"));
  setThemeMode(selectedTheme);
};

  // Keep the selected mode synchronized with the existing Background toggle.
  useEffect(() => {
    const app = document.querySelector(".pacova-app");

    if (!app) return;

    const observer = new MutationObserver(() => {
      const currentTheme = app.getAttribute("data-theme");

      if (currentTheme === "dark" || currentTheme === "light") {
        setThemeMode(currentTheme);
      }
    });

    observer.observe(app, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const activeSectionData = settingsSections.find(
    (section) => section.name === activeSection
  );

  const sectionBorders: Record<string, string> = {
    ACCOUNT: "border-pacova-green/90",
    SECURITY: "border-yellow-400/90",
    APPEARANCE: "border-[#B069DB]/90",
    LANGUAGE: "border-[#59B5F7]/90",
  };
const sectiontext: Record<string, string> = {
    ACCOUNT: "text-pacova-green",
    SECURITY: "text-yellow-400",
    APPEARANCE: "text-[#B069DB]",
    LANGUAGE: "text-[#59B5F7]",
  };
  // Desktop header only. The mobile header is rendered once below.
  const renderSectionHeader = () => (
    <div
      className={`hidden min-w-0 items-center gap-3 border-b py-3 sm:gap-4 md:flex ${
        sectionBorders[activeSection]
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center sm:h-12 sm:w-12">
        <img
          src={activeSectionData?.image}
          alt=""
          className="h-9 w-9 object-contain sm:h-13 sm:w-13"
        />
      </div>

      <h2 className={`min-w-0 flex-1 font-press-start text-sm sm:text-base ${sectiontext[activeSection]}`}>
        {t(activeSection.toLowerCase())}
      </h2>
    </div>
  );

  return (
    <Background>
      <Navbar activeTab="SETTINGS" onSelectTab={handleSelectTab} />

      <main className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="grid min-h-0 flex-1 grid-cols-1 items-start gap-5 md:grid-cols-[230px_minmax(0,1fr)]">

          {/* LEFT: SETTINGS SIDEBAR */}
          <Card variant="gray" className="hidden h-fit p-4 sm:p-5 md:block">
            <div
              className={`mb-5 border-b pb-4 ${
                sectionBorders[activeSection]
              }`}
            >
              <p className="font-pixelify text-sm uppercase tracking-wider text-pacova-green">
                {t("settings")}
              </p>

              <p className="mt-2 font-vt323 text-lg text-gray-500">
                {t("pacovaSystem")}
              </p>
            </div>

            <nav
              aria-label={t("settings")}
              className="flex flex-col gap-2"
            >
              {settingsSections.map((section) => {
                const isActive = activeSection === section.name;

                return (
                  <button
                    key={section.name}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveSection(section.name)}
                    className={`
                      group relative flex min-h-[58px] min-w-0 items-center gap-2
                      border-2 px-2 py-2 text-left transition-all duration-150
                      sm:gap-3 sm:px-3
                      ${
                        isActive
                          ? "rounded border-pacova-green bg-pacova-green/10 text-white shadow-[3px_3px_0_#333A0E,0_0_12px_rgba(142,214,3,0.2)]"
                          : "rounded border-transparent text-gray-400 hover:border-pacova-green/50 hover:bg-pacova-green/5 hover:text-white"
                      }
                    `}
                  >
                    <img
                      src={section.image}
                      alt=""
                      className="h-6 w-6 shrink-0 object-contain sm:h-8 sm:w-8"
                    />

                    <span className="break-words font-vt323 text-base uppercase sm:text-xl">
                      {t(section.name.toLowerCase())}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 border-t border-pacova-pink/30 pt-5">
              <PixelButton
                onClick={handleLogout}
                variant="outline-green"
                className="w-full"
              >
                {t("logout")}
              </PixelButton>
            </div>
          </Card>

          {/* RIGHT: ACTIVE SECTION */}
          <Card variant="gray" className="min-w-0 p-4 sm:p-6">

            {/* MOBILE SECTION SELECTOR */}
            <div className="relative z-20 mb-5 md:hidden">
              <button
                type="button"
                onClick={() =>
                  setShowMobileSections((prev) => !prev)
                }
                aria-expanded={showMobileSections}
                aria-controls="mobile-settings-sections"
                className={`flex w-full min-w-0 cursor-pointer items-center gap-3 border-b pb-4 text-left ${
                  sectionBorders[activeSection]
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <img
                    src={activeSectionData?.image}
                    alt=""
                    className="h-9 w-9 object-contain"
                  />
                </div>

                <span className="min-w-0 flex-1 font-press-start text-sm text-pacova-green">
                  {t(activeSection.toLowerCase())}
                </span>

                <span className="shrink-0 px-2 text-2xl text-[#A3E635]">
                  {showMobileSections ? "−" : "+"}
                </span>
              </button>

              {showMobileSections && (
                <nav
                  id="mobile-settings-sections"
                  aria-label={t("settings")}
                  className="mt-3 flex flex-col gap-2 rounded-lg border border-white/10 bg-[#0D0914] p-2"
                >
                  {settingsSections.map((section) => {
                    const isActive = activeSection === section.name;

                    return (
                      <button
                        key={section.name}
                        type="button"
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => {
                          setActiveSection(section.name);
                          setShowMobileSections(false);
                        }}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
                          isActive
                            ? "bg-pacova-green/10 text-pacova-green"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <img
                          src={section.image}
                          alt=""
                          className="h-6 w-6 shrink-0 object-contain"
                        />

                        <span className="font-pixelify text-sm">
                          {t(section.name.toLowerCase())}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* ACCOUNT */}
            {activeSection === "ACCOUNT" && (
              <section id="account" className="min-w-0">
                {renderSectionHeader()}

                {/* PROFILE INFORMATION */}
                <div className="relative min-w-0 p-2 sm:p-4">
                  <p className="pb-6 font-vt323 text-xl text-gray-400">
                    {t("accountDescription")}
                  </p>

                  <div className="flex min-w-0 flex-col items-center gap-6 sm:flex-row sm:items-start">

                    {/* AVATAR FRAME */}
                    <div
                      className="
                        relative flex h-32 w-32 shrink-0
                        items-center justify-center
                        rounded-lg border-2 border-pacova-pink
                        shadow-[0_0_20px_rgba(243,32,119,0.35)]
                        sm:h-36 sm:w-36
                      "
                    >
                      <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
                        <img
                          src={profile?.avatarUrl || accountIcon_green}
                          alt={t("profilePicture")}
                          className="h-24 w-24 rounded-lg object-cover sm:h-28 sm:w-28"
                        />

                        {/* PIXEL CORNERS */}
                        <span className="absolute left-0 top-0 h-5 w-5 border-l-[1px] border-t-[1px] border-pacova-green" />
                        <span className="absolute right-0 top-0 h-5 w-5 border-r-[1px] border-t-[1px] border-pacova-green" />
                        <span className="absolute bottom-0 left-0 h-5 w-5 border-b-[1px] border-l-[1px] border-pacova-green" />
                        <span className="absolute bottom-0 right-0 h-5 w-5 border-b-[1px] border-r-[1px] border-pacova-green" />
                      </div>
                    </div>

                    {/* ACCOUNT DETAILS */}
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <h3 className="break-words font-pixelify text-xl uppercase text-white sm:text-2xl">
                        {t("yourProfile")}
                      </h3>

                      <div>
                        <p className="font-vt323 text-lg uppercase text-gray-500">
                          {t("username")}
                        </p>

                        <p className="break-words font-vt323 text-2xl text-white">
                          {profile?.username ?? user?.username ?? "PLAYER"}
                        </p>
                      </div>

                      <div>
                        <p className="font-vt323 text-lg uppercase text-gray-500">
                          {t("email")}
                        </p>

                        <p className="break-all font-vt323 text-xl text-white">
                          {user?.email ?? t("noEmail")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* EDIT PROFILE */}
                  <div className="mt-6 flex justify-end border-t border-pacova-green/20 pt-5">
                    <PixelButton
                      variant="gray"
                      onClick={() => navigate("/profile")}
                      className="w-full sm:w-64"
                    >
                      {t("editProfile")}
                    </PixelButton>
                  </div>
                </div>
              </section>
            )}

            {/* SECURITY */}
            {activeSection === "SECURITY" && (
              <section id="security" className="min-w-0">
                {renderSectionHeader()}

                <div className="relative min-w-0 p-2 sm:p-4">
                  <p className="pb-6 font-vt323 text-xl text-gray-400">
                    {t("manageSecurity")}
                  </p>

                  <PixelButton
                    variant="warning-yellow"
                    onClick={() =>
                      setShowTwoFactor((current) => !current)
                    }
                  >
                    {showTwoFactor ? t("close2fa") : t("manage2fa")}
                  </PixelButton>

                  {showTwoFactor && (
                    <div className="mb-5 mt-5">
                      <TwoFactorSetup />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* APPEARANCE */}
            {activeSection === "APPEARANCE" && (
              <section id="appearance" className="min-w-0">
                {renderSectionHeader()}

                <div className="relative min-w-0 p-2 sm:p-4">
                  <p className="pb-6 font-vt323 text-xl text-gray-400">
                    {t("customizeInterface")}
                  </p>

                  {/* DARK / LIGHT MODE */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* DARK MODE */}
                    <button
                      type="button"
                      aria-pressed={themeMode === "dark"}
                      onClick={() => handleThemeChange("dark")}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        themeMode === "dark"
                          ? "border-[#B069DB] bg-[#B069DB]/10 shadow-[0_0_12px_rgba(176,105,219,0.15)]"
                          : "border-white/10 bg-black/20 hover:border-[#B069DB]/60"
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className="font-pixelify text-sm text-white">
                          {t("darkMode")}
                        </span>

                        {themeMode === "dark" && (
                          <span className="font-vt323 text-sm text-[#B069DB]">
                            {t("active")}
                          </span>
                        )}
                      </div>

                      <div className="mb-3 flex h-20 overflow-hidden rounded-md border border-white/10 bg-[#0D0914]">
                        <div className="w-2/3 p-3">
                          <div className="mb-2 h-2 w-1/2 rounded-sm bg-[#B069DB]" />
                          <div className="mb-2 h-2 w-4/5 rounded-sm bg-white/25" />
                          <div className="h-2 w-3/5 rounded-sm bg-white/10" />
                        </div>

                        <div className="m-2 flex-1 rounded-sm border border-[#B069DB]/40 bg-[#510950]" />
                      </div>
                    </button>

                    {/* LIGHT MODE */}
                    <button
                      type="button"
                      aria-pressed={themeMode === "light"}
                      onClick={() => handleThemeChange("light")}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        themeMode === "light"
                          ? "border-[#B069DB] bg-[#B069DB]/10 shadow-[0_0_12px_rgba(176,105,219,0.15)]"
                          : "border-white/10 bg-black/20 hover:border-[#B069DB]/60"
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <span className="font-pixelify text-sm text-white">
                          {t("lightMode")}
                        </span>

                        {themeMode === "light" && (
                          <span className="font-vt323 text-sm text-[#B069DB]">
                            {t("active")}
                          </span>
                        )}
                      </div>

                      <div className="mb-3 flex h-20 overflow-hidden rounded-md border border-[#D7C7E5] bg-[#F7F3FB]">
                        <div className="w-2/3 p-3">
                          <div className="mb-2 h-2 w-1/2 rounded-sm bg-[#B069DB]" />
                          <div className="mb-2 h-2 w-4/5 rounded-sm bg-[#6B6075]/40" />
                          <div className="h-2 w-3/5 rounded-sm bg-[#6B6075]/20" />
                        </div>

                        <div className="m-2 flex-1 rounded-sm border border-[#B069DB]/40 bg-[#EADCF2]" />
                      </div>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* LANGUAGE */}
            {activeSection === "LANGUAGE" && (
              <section id="language" className="min-w-0">
                {renderSectionHeader()}

                <div className="relative min-w-0 p-2 sm:p-4">
                  <p className="font-vt323 text-xl text-gray-400">
                    {t("chooseLanguage")}
                  </p>

                  <div className="mt-6 w-full min-w-0 sm:w-48 sm:shrink-0">
                    <select
                      id="interface-language"
                      value={language}
                      onChange={(event) =>
                        handleLanguageChange(event.target.value)
                      }
                      className="w-full rounded-lg border border-[#59B5F7] bg-[#0D0914] px-3 py-2 font-vt323
                      text-lg text-white outline-none focus:border-pacova-green focus:ring-1 focus:ring-pacova-green">
                      <option value="en">ENGLISH</option>
                      <option value="fr">FRANÇAIS</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

          </Card>
        </div>
      </main>
    </Background>
  );
}
