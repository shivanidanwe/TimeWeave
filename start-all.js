const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('  TimeWeave — Adaptive Personal Time Optimizer');
console.log('  Starting all services: Backend, ML Service, Frontend');
console.log('====================================================\n');

function runService(name, command, args, cwd) {
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'inherit'
  });

  proc.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  proc.on('close', (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
  });

  return proc;
}

const rootDir = __dirname;

// 1. Python FastAPI ML Service on port 8000
console.log('[Startup] Launching Python AI/ML Service on port 8000...');
const mlProc = runService(
  'ML Service',
  'python',
  ['ml_service/main.py'],
  rootDir
);

// 2. Node.js Express Backend on port 5000
console.log('[Startup] Launching Express Backend API on port 5000...');
const backendProc = runService(
  'Backend',
  'npm',
  ['run', 'dev'],
  path.join(rootDir, 'backend')
);

// 3. React Vite Frontend on port 3000
console.log('[Startup] Launching React Vite Frontend on port 3000...');
const frontendProc = runService(
  'Frontend',
  'npm',
  ['run', 'dev'],
  path.join(rootDir, 'frontend')
);

process.on('SIGINT', () => {
  console.log('\n[TimeWeave] Shutting down all services...');
  mlProc.kill();
  backendProc.kill();
  frontendProc.kill();
  process.exit(0);
});
