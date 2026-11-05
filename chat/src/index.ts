import friendsRouter from './routes/friends';
import express from 'express';
import http from 'http';
import { setupWebSocket } from './ws/websocket';
import messagesRouter from './routes/messages';
import blocksRouter from './routes/blocks';
import notificationsRouter from './routes/notifications';


const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(messagesRouter);
app.use(blocksRouter);
app.use(notificationsRouter);
app.use(friendsRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'chat' });
});

const server = http.createServer(app);
setupWebSocket(server); // websocket shares the same port

server.listen(PORT);