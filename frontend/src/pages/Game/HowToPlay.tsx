import { useNavigate } from "react-router-dom";
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

  return (
    <Background>
      <main className="w-full h-screen overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">
          <h1 className="font-press-start text-xl sm:text-3xl text-center text-[#F32077]">
            HOW TO PLAY
          </h1>

          <Card variant="pink">
            <h2 className={TITLE}>THE GAME</h2>
            <img src={pacman} alt="Pac-Man" className="w-14 mb-3" />
            <p className={TEXT}>
              Welcome to Pacova, a retro arcade chase game! You are Pac-Man,
              trapped in a glowing neon maze full of dots. Your mission: eat
              every single dot to clear the level. But you are not alone. Four
              ghosts roam the maze and they want to catch you. Touch one and you
              lose a life, and you only have 3. Grab a power pellet and the
              tables turn: the ghosts turn blue and you can hunt them down for
              big points. Play solo against the bot, share the screen with a
              friend, or challenge players online. The highest score wins!
            </p>
          </Card>

          <Card variant="pink">
            <h2 className={TITLE}>CONTROLS</h2>
            <p className={TEXT}>
              Use the arrow keys or W A S D to move up, down, left and right.
              Press a turn a little early, the game remembers it and turns for
              you at the next corner.
            </p>
            <div className={`${TEXT} mt-3 flex gap-6`}>
              <span>&#8593; &#8595; &#8592; &#8594;</span>
              <span>W A S D</span>
            </div>
          </Card>

          <Card variant="pink">
            <h2 className={TITLE}>THE GHOSTS</h2>
            <ul className={`${TEXT} flex flex-col gap-3`}>
              <li className="flex items-center gap-3">
                <img src={blinky} alt="Blinky" className="w-10" />
                <span><b className="text-[#ef4444]">BLINKY</b> - chases you</span>
              </li>
              <li className="flex items-center gap-3">
                <img src={pinky} alt="Pinky" className="w-10" />
                <span><b className="text-[#ec4899]">PINKY</b> - ambushes ahead</span>
              </li>
              <li className="flex items-center gap-3">
                <img src={inky} alt="Inky" className="w-10" />
                <span><b className="text-[#0891b2]">INKY</b> - unpredictable</span>
              </li>
              <li className="flex items-center gap-3">
                <img src={clyde} alt="Clyde" className="w-10" />
                <span><b className="text-[#ea580c]">CLYDE</b> - chases, then wanders</span>
              </li>
            </ul>
          </Card>

          <Card variant="pink">
            <h2 className={TITLE}>SCORING</h2>
            <ul className={TEXT}>
              <li>Dot: 10</li>
              <li>Power pellet: 50</li>
              <li>Ghost: 200, 400, 800, 1600</li>
              <li>Fruit: bonus</li>
            </ul>
          </Card>

          <Card variant="pink">
            <h2 className={TITLE}>TIPS</h2>
            <ul className={TEXT}>
              <li>&gt; Save power pellets for real danger.</li>
              <li>&gt; Use the tunnels to escape.</li>
              <li>&gt; Watch all four ghosts.</li>
            </ul>
          </Card>

          <div className="flex justify-center gap-4 pb-6">
            <PixelButton variant="outline-green" onClick={() => navigate(-1)}>
              Back
            </PixelButton>
            <PixelButton variant="filled-magenta" onClick={() => navigate("/choose")}>
              Play
            </PixelButton>
          </div>
        </div>
      </main>
    </Background>
  );
}