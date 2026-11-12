import type { ComponentProps, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "../ui/Background";
import PixelButton from "../ui/PixelButton";
import GameSettings from "./GameSettings";

// One setup screen for local / online / bot: same title, (extra fields), the 3 pickers, Back + Start.
// Back always returns to the "select mode" page.
type Props = ComponentProps<typeof GameSettings> & {
  onStart: () => void;
  startLabel?: string;
  startDisabled?: boolean;
  children?: ReactNode; // extra fields shown above the pickers (e.g. the room name)
};

export default function GameSetup({
  onStart,
  startLabel,
  startDisabled,
  children,
  ...settings // difficulty, mazeId, timeLimit + their 3 onChange
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Background>
      <main className="flex-1 w-full max-w-sm mx-auto px-4 py-6 flex flex-col items-center justify-center gap-4 *:!w-full">
        <h1 className="font-vt323 text-2xl sm:text-3xl text-center text-pacova-green">
          ▼ {t("game_setup_title")} ▼
        </h1>

        {children}
        <GameSettings {...settings} />

        <div className="flex flex-wrap justify-center gap-4 mt-2 !w-auto">
          <PixelButton variant="danger-red" onClick={() => navigate("/choose")}>
            {t("online_game_back_to_menu")}
          </PixelButton>
          <PixelButton variant="filled-green" disabled={startDisabled} onClick={onStart}>
            {startLabel ?? t("local_game_start")}
          </PixelButton>
        </div>
      </main>
    </Background>
  );
}