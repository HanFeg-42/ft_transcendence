
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "../../components/ui/Background";
import Card from "../../components/ui/Card";
import PixelButton from "../../components/ui/PixelButton";
import pacman from "../../assets/icons/packmann.png";
import blinky from "../../assets/icons/gost-red.png";
import pinky from "../../assets/icons/gost-pink.png";
import inky from "../../assets/icons/gost-blue.png";
import clyde from "../../assets/icons/gost-orange.png";

// Colors chosen to stay readable on both the dark and the light theme
const TITLE = "font-press-start text-sm mb-3 text-[#F32077]";
const TEXT = "font-vt323 text-xl leading-tight text-[#8B5CF6]";

export default function HowToPlay() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Background>
      <main className="w-full h-screen overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">
          <h1 className="font-press-start text-xl sm:text-3xl text-center text-[#F32077]">
            {t("howToPlay_title")}
          </h1>

          <Card variant="pink">
            <h2 className={TITLE}>{t("howToPlay_game")}</h2>
            <img src={pacman} alt="Pac-Man" className="w-14 mb-3" />
            <p className={TEXT}>
              {t("howToPlay_gameDescription")}
            </p>
          </Card>

          <Card variant="pink">
            <h2 className={TITLE}>{t("howToPlay_controls")}</h2>
            <p className={TEXT}>
              {t("howToPlay_controlsDescription")}
            </p>
            <div className={`${TEXT} mt-3 flex gap-6`}>
              <span>&#8593; &#8595; &#8592; &#8594;</span>
              <span>W A S D</span>
            </div>
          </Card>

          <Card variant="pink">
            <h2 className={TITLE}>{t("howToPlay_ghosts")}</h2>
            <ul className={`${TEXT} flex flex-col gap-3`}>
              <li className="flex items-center gap-3">
                <img src={blinky} alt="Blinky" className="w-10" />
                <span><b className="text-[#ef4444]">{t("howToPlay_blinky")}</b> - {t("howToPlay_blinkyDescription")}</span>
              </li>
              <li className="flex items-center gap-3">
                <img src={pinky} alt="Pinky" className="w-10" />
                <span><b className="text-[#ec4899]">{t("howToPlay_pinky")}</b> - {t("howToPlay_pinkyDescription")}</span>
              </li>
              <li className="flex items-center gap-3">
                <img src={inky} alt="Inky" className="w-10" />
                <span><b className="text-[#0891b2]">{t("howToPlay_inky")}</b> - {t("howToPlay_inkyDescription")}</span>
              </li>
              <li className="flex items-center gap-3">
                <img src={clyde} alt="Clyde" className="w-10" />
                <span><b className="text-[#ea580c]">{t("howToPlay_clyde")}</b> - {t("howToPlay_clydeDescription")}</span>
              </li>
            </ul>
          </Card>

          <Card variant="pink">
            <h2 className={TITLE}>{t("howToPlay_scoring")}</h2>
            <ul className={TEXT}>
              <li>{t("howToPlay_dot")}</li>
              <li>{t("howToPlay_powerPellet")}</li>
              <li>{t("howToPlay_ghostPoints")}</li>
              <li>{t("howToPlay_fruit")}</li>
            </ul>
          </Card>

          <Card variant="pink">
            <h2 className={TITLE}>{t("howToPlay_tips")}</h2>
            <ul className={TEXT}>
              <li>&gt; {t("howToPlay_tip1")}</li>
              <li>&gt; {t("howToPlay_tip2")}</li>
              <li>&gt; {t("howToPlay_tip3")}</li>
            </ul>
          </Card>

          <div className="flex justify-center gap-4 pb-6">
            <PixelButton variant="outline-green" onClick={() => navigate(-1)}>
              {t("howToPlay_back")}
            </PixelButton>
            <PixelButton variant="filled-magenta" onClick={() => navigate("/choose")}>
              {t("howToPlay_play")}
            </PixelButton>
          </div>
        </div>
      </main>
    </Background>
  );
}
