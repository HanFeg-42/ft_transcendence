import { Link } from 'react-router-dom';
import ArenaBackground from '../components/ui/ArenaBackground';
import PixelButton from '../components/ui/PixelButton';

export default function Welcome() {
  return (
    <ArenaBackground>
      <div className="flex-1 flex items-center px-6 md:px-16 py-12">
        <div className="max-w-xl w-full">
          <div className="font-vt323 text-pacova-green text-2xl mb-4">
            . . .
          </div>

          <h1 className="font-pixelify text-white text-3xl md:text-5xl leading-tight uppercase tracking-wide">
            Level Up
            <br />
            With <span className="text-pacova-pink">Pacova</span>
            <br />
            Join The Arena..
          </h1>

          <div className="font-vt323 text-pacova-green text-2xl my-4">
            - - -
          </div>

          <p className="font-vt323 text-gray-400 text-lg md:text-xl mb-8">
            Challenge your friends, master the maze,
            <br />
            and become the ultimate PACOVA champion.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/login">
              <PixelButton variant="filled-pink" size="md">
                LOGIN
              </PixelButton>
            </Link>

            <Link to="/signup">
              <PixelButton variant="outline-green" size="md">
                SIGNUP
              </PixelButton>
            </Link>
          </div>
        </div>
      </div>
    </ArenaBackground>
  );
}