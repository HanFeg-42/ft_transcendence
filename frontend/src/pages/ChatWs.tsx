import { useChatSocket } from '../hooks/useChatSocket';

const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJNYWxpa2EiLCJpYXQiOjE3ODkyMTIzNjl9.aiTKHwKAA1wzWwKuWmHtuhMHUe94__ebepFH9ZO5bZI"; // matches x-user-id shape: { userId: <number> }

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