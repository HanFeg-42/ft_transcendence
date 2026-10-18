import PixelButton from '../../components/ui/PixelButton';
import PacManIcon from './PacManIcon';
import { ICONS } from '../../utils/icons';

const GHOSTS: Array<keyof typeof ICONS> = ['gost-red', 'gost-pink', 'gost-blue', 'gost-orange'];

interface GameInviteModalProps {
  isOpen: boolean;
  isReceiver: boolean;
  friendName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function GameInviteModal({
  isOpen, 
  isReceiver, 
  friendName, 
  onConfirm, 
  onCancel
}: GameInviteModalProps) {
    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="relative bg-pacova-surface border-2 border-pacova-green shadow-neon-green pixel-corners-3step max-w-sm w-full p-6 text-center">
        <span className="absolute inset-0 pixel-scanlines pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-black/60 border-2 border-pacova-green flex items-center justify-center">
            <PacManIcon className="w-9 h-9" />
          </div>

          <h3 className="font-pixelify text-pacova-green text-xl uppercase tracking-wide">
            Game Invitation
          </h3>

          {isReceiver ? (
            <p className="font-vt323 text-lg text-gray-200">
              <span className="text-white">{friendName}</span> invited you to play
              <br />
              <span className="font-pixelify text-2xl text-pacova-green">Pacova</span>
            </p>
          ) : (
            <p className="font-vt323 text-lg text-gray-200">
              <span className="text-white"></span> Invite {friendName} to play
              <br />
              <span className="font-pixelify text-2xl text-pacova-green">Pacova</span>
            </p>
          )}

          <div className="flex gap-3">
            {GHOSTS.map((name) => (
              <img key={name} src={ICONS[name]} alt="" className="w-8 h-8 image-rendering-pixelated" />
            ))}
          </div>

          <p className="font-vt323 text-gray-400 text-base">Ready to chase some ghosts?</p>

          <div className="flex gap-3 mt-1">
            {isReceiver && (
              <>
                <PixelButton variant="filled-green" size="md" onClick={onConfirm}>Accept</PixelButton>
                <PixelButton variant="outline-magenta" size="md" onClick={onCancel}>Decline</PixelButton>
              </>
            )}
            {!isReceiver && (
              <>
                <PixelButton variant="filled-green" size="md" onClick={onConfirm}>Send</PixelButton>
                <PixelButton variant="outline-magenta" size="md" onClick={onCancel}>Cancel</PixelButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}