import app from './app';

const PORT = 3004;

app.listen(PORT, () => {
  console.log(`[USER-SERVICE] Listening on port ${PORT}`);
});