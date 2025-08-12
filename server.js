const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const os = require('os');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Change this to your actual HTML folder path if different
const htmlPath = '/home/ethem/Downloads/terminal';
app.use(express.static(htmlPath));

io.on('connection', (socket) => {
  const shell = 'bash';

  // Clone environment and override PS1 to customize prompt
  const env = { ...process.env };
  env.PS1 = '\\u@ethemterminal:\\w\\$ ';

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: env,
  });

  ptyProcess.on('data', (data) => {
    socket.emit('output', data);
  });

  socket.on('input', (data) => {
    ptyProcess.write(data);
  });

  socket.on('resize', (size) => {
    ptyProcess.resize(size.cols, size.rows);
  });

  socket.on('disconnect', () => {
    ptyProcess.kill();
  });
});

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(htmlPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Terminal running at http://localhost:${PORT}/`);
});
