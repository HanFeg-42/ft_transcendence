// import { useState } from "react";
// https://i.pinimg.com/236x/ff/12/2e/ff122eaf3ea44fcb8f0e5cf841b6b97a.jpg

import securityIcon from "../assets/icons/sc.png";
import appearanceIcon from "../assets/icons/palette-de-couleurs.png";
import languageIcon from "../assets/icons/lang.png";
import preferencesIcon from "../assets/icons/options (1).png";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { useEffect, useState } from "react";
import { getMyProfile, type ProfileData } from "../services/userService";


import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
import Card from "../components/ui/Card";
import PixelButton from "../components/ui/PixelButton";
import TwoFactorSetup from "../components/TwoFactorSetup";
import { useAuth } from "../context/AuthContext";

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
  const { logout, user, token } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);

useEffect(() => {
  if (!token) return;

  getMyProfile(token)
    .then(setProfile)
    .catch((error) => {
      console.error("Failed to load profile:", error);
    });
}, [token]);
  const { t } = useTranslation();

  const [friendRequests, setFriendRequests] = useState(true);
  const [gameInvitations, setGameInvitations] = useState(true);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [language, setLanguage] = useState(i18n.language);

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];
    if (path) navigate(path);
  };

  const handleLanguageChange = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    void i18n.changeLanguage(selectedLanguage);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
    } catch {
      setLogoutError(t("logoutError"));
      setIsLoggingOut(false);
    }
  };

  const sectionTitle = "font-press-start text-sm text-pacova-green";

  const description = "mt-1 font-vt323 text-xl text-gray-400";

  // const actionButton =
  //   "border border-pacova-green px-4 py-2 " +
  //   "font-vt323 text-lg text-pacova-green " +
  //   "transition hover:bg-pacova-green hover:text-black " +
  //   "disabled:cursor-not-allowed disabled:opacity-50";

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
              <div className="relative min-h-[350px] overflow-hidden">

                {/* Account header */}
                <div className="relative z-10 mb-5">
                  <div className="mb-1 flex items-center gap-2">
                    {/* <span className="h-2 w-2 bg-pacova-green shadow-[0_0_8px_#8ED603]" /> */}

                    <h2 className={sectionTitle}>
                      {t("account")}
                    </h2>
                  </div>

                  <p className={description}>
                    {t("accountDescription")}
                  </p>
                </div>

{/* Profile information */}
<div className="relative p-4">
  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">

    {/* Avatar frame */}
    <div
      className="
        relative flex h-32 w-32 shrink-0
        items-center justify-center
        rounded-lg border-2 border-pacova-pink
        shadow-[0_0_20px_rgba(142,214,3,0.20)]
        sm:h-36 sm:w-36
      "
    >
      <div className="relative h-30 w-30 flex items-center justify-center">
        <img
          src={profile?.avatarUrl || accountIcon_green}
          alt={t("pictureAlt")}
          className="w-25 h-25 object-contain"
        />

        {/* Pixel corners */}
        <span className="absolute left-0 top-0 h-5 w-5 border-l-[3px] border-t-[3px] border-pacova-green" />
        <span className="absolute right-0 top-0 h-5 w-5 border-r-[3px] border-t-[3px] border-pacova-green" />
        <span className="absolute bottom-0 left-0 h-5 w-5 border-b-[3px] border-l-[3px] border-pacova-green" />
        <span className="absolute bottom-0 right-0 h-5 w-5 border-b-[3px] border-r-[3px] border-pacova-green" />
      </div>
    </div>

    {/* Picture title and account details */}
    <div className="min-w-0 flex-1 text-center sm:text-left">

      <h3 className="font-pixelify text-2xl uppercase text-white sm:text-3xl">
        {t("yourPicture")}
      </h3>

      {/* Username */}
      <div>
        <p className="font-vt323 text-lg uppercase text-gray-500">
          {t("username")}
        </p>

        <p className="break-words font-vt323 text-xl text-white">
          {profile?.username || user?.username || t("notAvailable")}
        </p>
      </div>

      {/* Email */}
      <div>
        <p className="font-vt323 text-lg uppercase text-gray-500">
          {t("email")}
        </p>

        <p className="break-all font-vt323 text-xl text-white">
          {user?.email || t("noEmail")}
        </p>
      </div>
    </div>
  </div>

  {/* Edit profile button on the right */}
  <div className="mt-6 flex justify-end border-t border-pacova-gray/40 pt-5">
    <PixelButton
      variant="gray"
      onClick={() => navigate("/profile")}
      className="w-full sm:w-64"
    >
      {t("editProfile")} →
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
                <div className="flex items-center">
                  <img
                    src={securityIcon}
                    alt="security"
                    className="h-17 w-17 object-contain"
                  />
                <div>
                  <h2 className="font-press-start text-sm text-yellow-400">
                  {/* // {sectionTitle}> */}
                    {t("security")}
                  </h2>

                  <p className={`${description} mt-3`}>
                    {t("securityDescription")}
                  </p>
                </div>
                </div>


                
     
                <PixelButton
                  variant="warning-yellow"
                  onClick={() => setShowTwoFactor((current) => !current)}
                  // aria-expanded={showTwoFactor}
                  // className={actionButton}
                >
                  {showTwoFactor ? t("close2fa") : t("manage2fa")}
                </PixelButton>
              </div>

              {showTwoFactor && (
                <div className="mt-5 mb-5 border-t border-yellow-400/40 pt-5">
                  <TwoFactorSetup />
                </div>
              )}

              <div className="mt-5 mb-5 border-t border-yellow-400/40 pt-5">
                <PixelButton
                  variant="gray"
                  // disabled={isLoggingOut}
                  onClick={handleLogout}
                  // className={actionButton}
                >
                  {isLoggingOut ? t("loggingOut") : t("logout")}
                </PixelButton>

                {logoutError && (
                  <p
                    role="alert"
                    className="mt-3 font-vt323 text-lg text-pacova-green"
                  >
                    {logoutError}
                  </p>
                )}
              </div>
            </Card>
          </section>

          {/* PREFERENCES */}
          <section id="preferences">
            <Card variant="gray" className="p-5 md:p-6">
              {/* <div className="mb-5"> */}
                <div className="flex items-center gap-4 mb-5">
                  <img
                    src={preferencesIcon}
                    alt="Appearance"
                    className="h-10 w-10 object-contain"
                  />

          <div>
          <h2 className="font-press-start text-sm text-[#59B5F7]">
                {/* <h2 className={sectionTitle}> */}
                  {t("preferences")}
                </h2>

                <p className={`${description}`}>
                  {t("preferencesDescription")}
                </p>
              </div>
              </div>


              {/* Friend requests */}
              <div className="flex items-center justify-between gap-4 border-t border-[#59B5F7]/40 py-5">
                <div>
                  <h3 className="font-pixelify text-base text-white">
                    {t("friendRequests")}
                  </h3>

                  <p className="mt-1 font-vt323 text-base text-gray-400">
                    {t("friendRequestsDescription")}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={friendRequests}
                  aria-label={t("friendRequests")}
                  onClick={() => setFriendRequests((value) => !value)}
                  className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                    friendRequests
                      ? "border-pacova-green bg-pacova-green/30"
                      : "border-pacova-gray bg-pacova-gray/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
                      friendRequests
                        ? "left-[22px] bg-pacova-green"
                        : "left-0.5 bg-pacova-gray"
                    }`}
                  />
                </button>
              </div>

              {/* Game invitations */}
              <div className="flex items-center justify-between gap-4 border-t border-[#59B5F7]/40 py-5">
                <div>
                  <h3 className="font-pixelify text-base text-white">
                    {t("gameInvitations")}
                  </h3>

                  <p className="mt-1 font-vt323 text-base text-gray-400">
                    {t("gameInvitationsDescription")}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={gameInvitations}
                  aria-label={t("gameInvitations")}
                  onClick={() => setGameInvitations((value) => !value)}
                  className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                    gameInvitations
                      ? "border-pacova-green bg-pacova-green/30"
                      : "border-pacova-gray bg-pacova-gray/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
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
  <Card variant="gray" className="p-4 md:p-5">
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={appearanceIcon}
          alt="Appearance"
          className="h-10 w-10 object-contain"
        />

        <div>
          <h2 className="font-press-start text-sm text-[#B069DB]">
            {/* {sectionTitle} */}
            {t("appearance")}
          </h2>

          <p className={`mt-1 ${description}`}>
            {t("interfaceColors")}
          </p>
        </div>
      </div>

      {/* Theme and color palette */}
      <div className="flex flex-col gap-4 border-t border-[#B069DB]/40 pt-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Theme description */}
        <div className="min-w-0">
          <p className="font-vt323 text-base text-gray-400">
            THEME
          </p>

          <h3 className="font-vt323 text-xl text-white">
            {t("themeName")}
          </h3>

          <p className="font-vt323 text-base text-gray-400">
            {t("themeDescription")}
          </p>
        </div>

        {/* PACOVA color palette */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4">

          <div className="flex flex-col items-center gap-1">
            <div
              className="h-8 w-8 rounded-full border border-purple-400 bg-[#0D0914]"
              title="Background"
            />
            <span className="font-vt323 text-sm text-gray-400">
              BG
            </span>
            {/* <span className="font-vt323 text-[10px] text-gray-400">
              #0D0914
            </span> */}
          </div>

          <div className="flex flex-col items-center gap-1">
            <div
              className="h-8 w-8 rounded-full border border-purple-300 bg-[#510950]"
              title="Purple"
            />
            <span className="font-vt323 text-sm text-gray-400">
              PURPLE
            </span>
            {/* <span className="font-vt323 text-sm text-gray-400">
              #510950
            </span> */}
          </div>

          <div className="flex flex-col items-center gap-1">
            <div
              className="h-8 w-8 rounded-full border border-pink-300 bg-[#F32077]"
              title="Pink"
            />
            <span className="font-vt323 text-sm text-gray-400">
              PINK
            </span>
            {/* <span className="font-vt323 text-[10px] text-gray-400">
              #F32077
            </span> */}
          </div>

          <div className="flex flex-col items-center gap-1">
            <div
              className="h-8 w-8 rounded-full border border-lime-300 bg-[#8ED603]"
              title="Green"
            />
            <span className="font-vt323 text-sm text-gray-400">
              GREEN
            </span>
            {/* <span className="font-vt323 text-[10px] text-gray-400">
              #8ED603
            </span> */}
          </div>

        </div>
      </div>
    </div>
  </Card>
</section>


          {/* LANGUAGE */}
          <section id="language">
            <Card variant="gray" className="p-5 md:p-6">
              <div className="flex flex-col gap-5 
              sm:flex-row sm:items-center sm:justify-between">
              <div className = "flex items-center gap-3">
                <img
          src={languageIcon}
          alt="language"
          className="h-12 w-12 object-contain"
        />
                <div>
                  <h2 className="font-press-start text-sm text-[#59B5F7]">
                  {/* <h2 className={sectionTitle}> */}
                    {t("language")}
                  </h2>

                  <p className={`${description} mt-3`}>
                    {t("chooseLanguage")}
                  </p>
                </div>
                </div>

                <select
                  aria-label={t("language")}
                  value={language}
                  onChange={(event) =>
                    handleLanguageChange(event.target.value)
                  }

                  // w-full appearance-none rounded-sm bg-[#0D0914]
// px-2 pr-8 py-2 font-vt323 text-lg text-white
// outline-none focus:ring-1 focus:ring-pacova-green sm:w-48
                  className="border border-[#59B5F7] rounded-lg bg-[#0D0914] 
                  px-2 py-2 pr-8 font-vt323 text-lg text-white 
                  outline-none focus:ring-1 focus:ring-pacova-green sm:w-48"
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
