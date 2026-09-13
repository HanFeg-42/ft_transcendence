import { useGameSocket } from '../hooks/useGameSocket';


const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJNYWxpa2EiLCJpYXQiOjE3ODkyMTIzNjl9.aiTKHwKAA1wzWwKuWmHtuhMHUe94__ebepFH9ZO5bZI";

export default function GameWs() {
  const { isConnected, sendPlayerInput } = useGameSocket(
        `wss://localhost/api/game/ws?token=${TEST_TOKEN}`);

  // Rendered UI
  return (
    <div style={{ padding: 20 }}>
      <p>Connected: {isConnected ? 'yes' : 'no'}</p>
      <button onClick={() => sendPlayerInput('up')}>Send Up</button>
    </div>
  );
}