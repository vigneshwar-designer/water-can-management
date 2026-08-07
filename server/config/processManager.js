const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.join(__dirname, '../data');
const SERVER_PID_FILE = path.join(DATA_DIR, 'server.pid');
const CLIENT_PID_FILE = path.join(DATA_DIR, 'client.pid');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to check if process is Node.js
function isNodeProcess(pid) {
  try {
    if (process.platform === 'win32') {
      const cmd = `(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).ProcessName`;
      const name = execSync(`powershell -Command "${cmd}"`, { encoding: 'utf8' }).trim();
      return name.toLowerCase() === 'node';
    } else {
      const cmd = `ps -p ${pid} -o comm=`;
      const name = execSync(cmd, { encoding: 'utf8' }).trim();
      return name.toLowerCase().includes('node');
    }
  } catch (e) {
    return false;
  }
}

// Helper to kill process safely
function killPid(pid, name = 'process') {
  if (pid === process.pid) return; // Don't kill ourselves
  
  if (isNodeProcess(pid)) {
    console.log(`⚠️ Terminating duplicate ${name} process with PID: ${pid}`);
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } else {
        process.kill(pid, 'SIGKILL');
      }
      console.log(`✅ Successfully terminated PID: ${pid}`);
    } catch (err) {
      console.log(`ℹ️ Could not terminate PID ${pid}: ${err.message}`);
    }
  }
}

// Kill process occupying specific TCP port (only if it is Node)
function killNodeOnPort(port) {
  try {
    let pid = null;
    if (process.platform === 'win32') {
      const cmd = `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess`;
      const stdout = execSync(`powershell -Command "${cmd}"`, { encoding: 'utf8' }).trim();
      if (stdout) {
        pid = parseInt(stdout.split('\n')[0].trim(), 10);
      }
    } else {
      const cmd = `lsof -t -i:${port} -sTCP:LISTEN`;
      const stdout = execSync(cmd, { encoding: 'utf8' }).trim();
      if (stdout) {
        pid = parseInt(stdout.split('\n')[0].trim(), 10);
      }
    }

    if (pid && !isNaN(pid) && pid !== process.pid) {
      if (isNodeProcess(pid)) {
        console.log(`⚠️ Port ${port} occupied by duplicate Node process (PID: ${pid}). Cleaning up...`);
        killPid(pid, `port ${port} occupant`);
      } else {
        console.log(`ℹ️ Port ${port} is occupied by non-Node process PID ${pid}. Leaving it intact.`);
      }
    }
  } catch (e) {
    // Ignore errors (port free or command unsupported)
  }
}

function cleanDuplicateProcesses(isStartup = false) {
  if (isStartup) {
    // In startup mode, just save the server PID and exit cleaner
    try {
      fs.writeFileSync(SERVER_PID_FILE, process.pid.toString(), 'utf8');
    } catch (err) {
      console.error('Failed to write server.pid:', err.message);
    }
    return;
  }

  // In pre-clean mode (run directly from CLI before servers start)
  console.log('🧹 Scanning for duplicate project instances...');

  // 1. Check server.pid file
  if (fs.existsSync(SERVER_PID_FILE)) {
    const pidStr = fs.readFileSync(SERVER_PID_FILE, 'utf8').trim();
    const pid = parseInt(pidStr, 10);
    if (!isNaN(pid)) {
      killPid(pid, 'previous backend server');
    }
  }

  // 2. Check client.pid file
  if (fs.existsSync(CLIENT_PID_FILE)) {
    const pidStr = fs.readFileSync(CLIENT_PID_FILE, 'utf8').trim();
    const pid = parseInt(pidStr, 10);
    if (!isNaN(pid)) {
      killPid(pid, 'previous frontend client');
    }
  }

  // 3. Clear node process on ports 5000 and 5173
  killNodeOnPort(5000);
  killNodeOnPort(5173);
}

// Run clean up immediately if executed directly from CLI
if (require.main === module) {
  cleanDuplicateProcesses(false);
}

module.exports = {
  cleanDuplicateProcesses,
  SERVER_PID_FILE,
  CLIENT_PID_FILE
};

