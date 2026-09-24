import { useGameSocket } from '../hooks/useGameSocket';


const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiaWF0IjoxNzg5Mzk1Nzk3fQ.tuYnM8If0DW7liaz5qH-h6v0FOEOqEwLok46wJtt8-Y";

export default function GameWs() {
  const { isConnected, sendPlayerInput } = useGameSocket(
        `wss://localhost/api/game/ws?token=${TEST_TOKEN}`,
        'game-1');
  // Rendered UI
  return (
    <div style={{ padding: 20 }}>
      <p>Connected: {isConnected ? 'yes' : 'no'}</p>
      <button onClick={() => sendPlayerInput('up')}>Send Up</button>
    </div>
  );
}