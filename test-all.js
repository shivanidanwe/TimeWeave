const { spawnSync } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('  TimeWeave — Running Automated Test Suite');
console.log('====================================================\n');

// 1. Python ML & Optimizer Tests
console.log('[Test Suite 1/3] Executing Python ML & Constraint Optimizer Tests...');
const pyTest = spawnSync('python', ['ml_service/tests/test_ml_and_optimizer.py'], {
  cwd: __dirname,
  stdio: 'inherit'
});

if (pyTest.status !== 0) {
  console.error('\n❌ Python ML & Optimizer Tests failed!');
  process.exit(1);
}
console.log('✓ Python ML & Constraint Optimizer Tests Passed Successfully.\n');

// 2. Node Backend API Integration Tests
console.log('[Test Suite 2/3] Executing Backend REST API Integration Tests...');
const backendTest = spawnSync('node', ['tests/api.test.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

if (backendTest.status !== 0) {
  console.error('\n❌ Backend REST API Integration Tests failed!');
  process.exit(1);
}
console.log('✓ Backend REST API Integration Tests Passed Successfully.\n');

// 3. Frontend component and navigation tests
console.log('[Test Suite 3/3] Executing Frontend Tests...');
const frontendTest = spawnSync(process.execPath, [
  path.join(__dirname, 'frontend', 'node_modules', 'vitest', 'vitest.mjs'),
  'run'
], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit'
});

if (frontendTest.status !== 0) {
  console.error('\n❌ Frontend Tests failed!');
  process.exit(1);
}
console.log('✓ Frontend Tests Passed Successfully.\n');

console.log('====================================================');
console.log('  🎉 All TimeWeave Automated Tests Passed Cleanly!');
console.log('====================================================');
