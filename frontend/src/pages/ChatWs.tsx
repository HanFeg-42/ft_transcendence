import { useChatSocket } from '../hooks/useChatSocket';

const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiaWF0IjoxNzg5Mzk1Nzk3fQ.tuYnM8If0DW7liaz5qH-h6v0FOEOqEwLok46wJtt8-Y"; // matches x-user-id shape: { userId: <number> }

export default function ChatWs() {
  const { isConnected, sendMessage } = useChatSocket(
    `wss://localhost/api/chat/ws?token=${TEST_TOKEN}`
  );

  return (
    <div style={{ padding: 20 }}>
      <p>Connected: {isConnected ? 'yes' : 'no'}</p>
      <button onClick={() => sendMessage(2, 'hello from test page')}>
        Send Test Message
      </button>
    </div>
  );
}