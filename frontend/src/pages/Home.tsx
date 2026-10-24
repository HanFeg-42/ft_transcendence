import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Background from "../components/ui/Background";
import Navbar from "../components/ui/Navbar";
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
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSelectTab = (tab: string) => {
    const path = routeMap[tab];

    if (path) {
      navigate(path);
    }
  };

  return (
    <Background>
      <Navbar activeTab="HOME" onSelectTab={handleSelectTab} />

      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-5 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-4 lg:px-10 lg:py-8">
        {/* Headline and supporting text */}
        <section className="order-1 min-w-0 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
          <h1 className="font-pixelify text-3xl font-bold uppercase leading-relaxed text-pacova-green drop-shadow-[0_0_12px_rgba(255,20,147,0.55)] sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl">
            {t("homeHeadline")}
          </h1>

          <p className="mt-4 font-vt323 text-lg uppercase tracking-wide text-gray-300 sm:text-xl md:text-2xl">
            {t("homeTagline")}
          </p>
        </section>

        {/* Pac-Man artwork */}
        <div className="order-2 flex min-w-0 items-center justify-center lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <img
            src="/images/pacova-hero.png"
            alt="Pac-Man and colorful ghosts inside a neon arcade maze"
            className="h-auto max-h-[48vh] w-full max-w-[430px] object-contain drop-shadow-[0_0_18px_rgba(255,20,147,0.18)] sm:max-h-[55vh] sm:max-w-[480px] lg:max-h-[75vh] lg:max-w-none"
          />
        </div>

        {/* Play button */}
        <div className="order-3 flex justify-center pt-2 lg:col-start-1 lg:row-start-2 lg:justify-start lg:pt-4">
          <PixelButton
            variant="filled-green"
            size="lg"
            onClick={() => navigate("/choose")}
            className="min-w-36 shadow-[0_0_18px_rgba(139,197,63,0.4)]"
          >
            {t("playNow")}
          </PixelButton>
        </div>
      </main>
    </Background>
  );
}
