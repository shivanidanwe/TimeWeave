const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('  TimeWeave — Adaptive Personal Time Optimizer');
console.log('  Starting all services: ML Service, Backend, Frontend');
console.log('====================================================\n');

function runService(name, command, args, cwd) {
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) console.log(`[${name}] ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) console.error(`[${name}] ${line}`);
    });
  });

  proc.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  proc.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.log(`[${name}] Process exited with code ${code}`);
    }
  });

  return proc;
}

const rootDir = __dirname;
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// 1. Python FastAPI ML Service on port 8000
console.log('[Startup] Launching Python AI/ML Service on port 8000...');
const mlProc = runService(
  'ML Service',
  'python',
  ['-u', 'ml_service/main.py'],
  rootDir
);

// 2. Node.js Express Backend on port 5000
console.log('[Startup] Launching Express Backend API on port 5000...');
const backendProc = runService(
  'Backend',
  npmCmd,
  ['run', 'dev'],
  path.join(rootDir, 'backend')
);

// 3. React Vite Frontend on port 3000
console.log('[Startup] Launching React Vite Frontend on port 3000...');
const frontendProc = runService(
  'Frontend',
  npmCmd,
  ['run', 'dev'],
  path.join(rootDir, 'frontend')
);

const procs = [
  { name: 'ML Service', proc: mlProc },
  { name: 'Backend', proc: backendProc },
  { name: 'Frontend', proc: frontendProc }
];

function shutdown() {
  console.log('\n[TimeWeave] Shutting down all services...');
  for (const { name, proc } of procs) {
    if (proc && proc.pid) {
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /pid ${proc.pid} /T /F 2>nul`);
        } else {
          proc.kill('SIGTERM');
        }
      } catch (e) {}
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
