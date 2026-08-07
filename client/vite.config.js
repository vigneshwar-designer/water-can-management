import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Write client PID so it can be terminated on duplicate run
try {
  const dataDir = path.resolve(__dirname, '../server/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(dataDir, 'client.pid'), process.pid.toString(), 'utf8');
} catch (e) {
  console.error("Vite failed to write client PID file:", e.message);
}

// Function to read backend port dynamically
function getBackendPort() {
  try {
    const portFilePath = path.resolve(__dirname, '../server/data/port.txt');
    if (fs.existsSync(portFilePath)) {
      const portStr = fs.readFileSync(portFilePath, 'utf8').trim();
      const port = parseInt(portStr, 10);
      if (!isNaN(port)) {
        return port;
      }
    }
  } catch (e) {
    // Ignore
  }
  return 5000; // Fallback to default
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'write-frontend-port',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          try {
            const address = server.httpServer.address();
            const port = typeof address === 'string' ? address : address?.port;
            if (port) {
              const portDir = path.resolve(__dirname, '../server/data');
              fs.writeFileSync(path.join(portDir, 'frontend_port.txt'), port.toString(), 'utf8');
            }
          } catch (e) {
            console.error("Vite failed to write frontend port:", e.message);
          }
        });
      }
    }
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Fallback target
        changeOrigin: true,
        secure: false,
        router: (req) => {
          const activeBackendPort = getBackendPort();
          return `http://localhost:${activeBackendPort}`;
        }
      }
    }
  }
});
