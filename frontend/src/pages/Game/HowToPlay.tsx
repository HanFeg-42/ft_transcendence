import { useNavigate } from "react-router-dom";
import Background from "../../components/ui/Background";
import PixelButton from "../../components/ui/PixelButton";
import Card from "../../components/ui/Card";

const GHOSTS = [
  { name: "Blinky", color: "text-red-500", text: "Chases you directly" },
  { name: "Pinky", color: "text-pink-400", text: "Ambushes ahead of you" },
  { name: "Inky", color: "text-cyan-400", text: "Unpredictable flanker" },
  { name: "Clyde", color: "text-orange-400", text: "Chases, then wanders off" },
];

const SCORES = [
  ["Dot", "10"],
  ["Power pellet", "50"],
  ["Ghost (scared)", "200 → 400 → 800 → 1600"],
  ["Fruit", "Bonus points"],
];

const TIPS = [
  "Press a turn early: the move is buffered.",
  "Save power pellets for real danger.",
  "Use the tunnels to escape.",
  "Watch all four ghosts, not just one.",
];

const Panel = ({
  title,
  color,
  children,
}: {
  title: string;
  color: "pink" | "green";
  children: React.ReactNode;
}) => (
  <Card variant={color}>
    <h2
      className={`font-press-start text-sm mb-3 ${
        color === "pink" ? "text-pacova-pink" : "text-pacova-green [.pacova-light_&]:text-[#4d7a00]"
      }`}
    >
      {title}
    </h2>
    <div className="font-vt323 text-xl text-gray-200 [.pacova-light_&]:text-[#30213f] leading-tight">
      {children}
    </div>
  </Card>
);

/** Second instructions page: goal, ghosts, scoring and tips. */
export default function HowToPlay() {
  const navigate = useNavigate();

  return (
    <Background>
      <main className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">
        <h1 className="font-press-start text-pacova-pink text-xl sm:text-3xl text-center drop-shadow-glow-pink">
          HOW TO PLAY
        </h1>

        <Panel title="OBJECTIVE" color="pink">
          Eat every dot in the maze, avoid the ghosts and keep your 3 lives.
          Power pellets turn ghosts blue: eat them for bonus points. In
          multiplayer, the highest score wins.
        </Panel>

        <div className="grid sm:grid-cols-2 gap-5">
          <Panel title="GHOSTS" color="green">
            <ul className="space-y-1">
              {GHOSTS.map((g) => (
                <li key={g.name}>
                  <span className={`${g.color} uppercase`}>{g.name}</span>
                  {" - "}
                  {g.text}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="SCORING" color="green">
            <ul className="space-y-1">
              {SCORES.map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{k}</span>
                  <span className="text-pacova-green [.pacova-light_&]:text-[#4d7a00] text-right">{v}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="TIPS" color="pink">
          <ul className="space-y-1">
            {TIPS.map((t) => (
              <li key={t}>&gt; {t}</li>
            ))}
          </ul>
        </Panel>

        <div className="flex justify-center gap-4 mt-2">
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