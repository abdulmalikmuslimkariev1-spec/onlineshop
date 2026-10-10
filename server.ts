import express from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure Python dependencies are installed on startup
try {
  console.log('Verifying Python pip availability...');
  try {
    execSync('/usr/bin/python3 -m pip --version', { stdio: 'ignore' });
  } catch (e) {
    console.log('pip is missing. Installing pip via get-pip.py...');
    execSync('/usr/bin/python3 get-pip.py', { stdio: 'inherit', cwd: __dirname });
  }

  console.log('Installing/verifying Python dependencies...');
  execSync('/usr/bin/python3 -m pip install -r backend/requirements.txt python-multipart', { stdio: 'inherit' });
} catch (err) {
  console.error('Dependency installation failed, continuing anyway:', err);
}

const app = express();
const PORT = 3000;

// Start FastAPI Backend
console.log('Starting FastAPI backend...');
const backend = spawn('/usr/bin/python3', [
  '-m', 'uvicorn',
  'app.main:app',
  '--host', '0.0.0.0',
  '--port', '8001'
], {
  cwd: path.join(__dirname, 'backend'),
  env: {
    ...process.env,
    PYTHONPATH: path.join(__dirname, 'backend')
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

import fs from 'fs';
const logStream = fs.createWriteStream('backend.log');
backend.stdout.pipe(logStream);
backend.stderr.pipe(logStream);

backend.on('error', (err) => {
  console.error('Failed to start backend:', err);
});

// Proxy /api requests to FastAPI
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8001',
  changeOrigin: true,
}));

// Serve Static Frontend (Production Build)
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
