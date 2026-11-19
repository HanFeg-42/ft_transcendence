import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import PixelButton from "../ui/PixelButton";
import Result from "./ResultCard";

// Shared popups for local / bot / remote, so all 3 modes look identical.

// The dark backdrop + pink card
export const Modal = ({
  title,
  win,
  children,
}: {
  title: string;
  win?: boolean; // green title when true, pink otherwise
  children: ReactNode;
}) => (
  <div className="fixed inset-0 z-[99] bg-black/80 flex items-center justify-center">
    <div className="w-[28rem] max-w-[92vw] p-6 flex flex-col items-center gap-5 bg-pacova-surface border-4 border-pacova-pink rounded-2xl shadow-neon-pink">
      <h1
        className={`font-press-start text-2xl text-center ${
          win
            ? "text-pacova-green drop-shadow-glow-green"
            : "text-pacova-pink drop-shadow-glow-pink"
        }`}
      >
        {title}
      </h1>
      {children}
    </div>
  </div>
);

// The top-right "MENU" button that opens the pause menu
export const MenuButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed top-4 right-4 z-50">
      <PixelButton variant="outline-green" size="sm" onClick={onClick}>
        {t("online_game_menu")}
      </PixelButton>
    </div>
  );
};

// Pause menu: Resume + Back to menu
export const PauseMenu = ({
  onResume,
  onQuit,
}: {
  onResume: () => void;
  onQuit: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Modal title={t("online_game_menu")} win>
      <div className="flex gap-6">
        <PixelButton variant="outline-green" size="md" onClick={onResume}>
          {t("local_game_resume")}
        </PixelButton>
        <PixelButton variant="danger-red" size="md" onClick={onQuit}>
          {t("online_game_back_to_menu")}
        </PixelButton>
      </div>
    </Modal>
  );
};

// Result popup: title, one card per player, Play again + Back to menu
export const ResultModal = ({
  title,
  win,
  players,
  onPlayAgain,
  onQuit,
  children,
}: {
  title: string;
  win: boolean;
  players: { name: string; score: number; lives: number; win: boolean }[];
  onPlayAgain: () => void;
  onQuit: () => void;
  children?: ReactNode; // optional extra line (e.g. match time)
}) => {
  const { t } = useTranslation();
  return (
    <Modal title={title} win={win}>
      <div className="flex gap-4 w-full">
        {players.map((p) => (
          <Result key={p.name} {...p} />
        ))}
      </div>
      {children}
      <div className="flex gap-6">
        <PixelButton variant="outline-green" size="md" onClick={onPlayAgain}>
          {t("online_game_play_again")}
        </PixelButton>
        <PixelButton variant="danger-red" size="md" onClick={onQuit}>
          {t("online_game_back_to_menu")}
        </PixelButton>
      </div>
    </Modal>
  );
};