import { useNavigate } from "react-router-dom";
import Background from "../../components/ui/Background";
import Card from "../../components/ui/Card";
import PixelButton from "../../components/ui/PixelButton";

// Colors chosen to stay readable on both the dark and the light theme
const TITLE = "font-press-start text-sm mb-3 text-[#F32077]";
const TEXT = "font-vt323 text-xl leading-tight text-[#8B5CF6]";

export default function HowToPlay() {
  const navigate = useNavigate();

  return (
    <Background>
      <main className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">
        <h1 className="font-press-start text-xl sm:text-3xl text-center text-[#F32077]">
          HOW TO PLAY
        </h1>

        <Card variant="pink">
          <h2 className={TITLE}>OBJECTIVE</h2>
          <p className={TEXT}>
            Eat every dot, avoid the ghosts and keep your 3 lives. Power pellets
            turn ghosts blue so you can eat them. In multiplayer, the highest
            score wins.
          </p>
        </Card>

        <div className="grid sm:grid-cols-2 gap-5">
          <Card variant="pink">
            <h2 className={TITLE}>GHOSTS</h2>
            <ul className={TEXT}>
              <li><b className="text-[#ef4444]">BLINKY</b> - chases you</li>
              <li><b className="text-[#ec4899]">PINKY</b> - ambushes ahead</li>
              <li><b className="text-[#0891b2]">INKY</b> - unpredictable</li>
              <li><b className="text-[#ea580c]">CLYDE</b> - chases, then wanders</li>
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
        </div>

        <Card variant="pink">
          <h2 className={TITLE}>TIPS</h2>
          <ul className={TEXT}>
            <li>&gt; Press a turn early, it is buffered.</li>
            <li>&gt; Save power pellets for real danger.</li>
            <li>&gt; Use the tunnels to escape.</li>
            <li>&gt; Watch all four ghosts.</li>
          </ul>
        </Card>

        <div className="flex justify-center gap-4">
          <PixelButton variant="outline-green" onClick={() => navigate(-1)}>
            Back
          </PixelButton>
          <PixelButton variant="filled-magenta" onClick={() => navigate("/choose")}>
            Play
          </PixelButton>
        </div>
      </main>
    </Background>
  );
}