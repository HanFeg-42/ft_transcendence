
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "../../components/ui/Background";
import Card from "../../components/ui/Card";
import PixelButton from "../../components/ui/PixelButton";
import pacman from "../../assets/icons/packmann.png";
import redGhost from "../../assets/icons/gost-red.png";
import pinkGhost from "../../assets/icons/gost-pink.png";
import blueGhost from "../../assets/icons/gost-blue.png";
import orangeGhost from "../../assets/icons/gost-orange.png";

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
            <div className="flex gap-3 mb-3">
              <img src={redGhost} alt="" className="w-10" />
              <img src={pinkGhost} alt="" className="w-10" />
              <img src={blueGhost} alt="" className="w-10" />
              <img src={orangeGhost} alt="" className="w-10" />
            </div>
            <p className={TEXT}>{t("howToPlay_ghostsDescription")}</p>
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
