const { spawnSync } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('  TimeWeave — Running Automated Test Suite');
console.log('====================================================\n');

// 1. Python ML & Optimizer Tests
console.log('[Test Suite 1/2] Executing Python ML & Constraint Optimizer Tests...');
const pyTest = spawnSync('python', ['ml_service/tests/test_ml_and_optimizer.py'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

if (pyTest.status !== 0) {
  console.error('\n❌ Python ML & Optimizer Tests failed!');
  process.exit(1);
}
console.log('✓ Python ML & Constraint Optimizer Tests Passed Successfully.\n');

// 2. Node Backend API Integration Tests
console.log('[Test Suite 2/2] Executing Backend REST API Integration Tests...');
const backendTest = spawnSync('node', ['tests/api.test.js'], {
  cwd: path.join(__dirname, 'backend'),
  shell: true,
  stdio: 'inherit'
});

if (backendTest.status !== 0) {
  console.error('\n❌ Backend REST API Integration Tests failed!');
  process.exit(1);
}
console.log('✓ Backend REST API Integration Tests Passed Successfully.\n');

console.log('====================================================');
console.log('  🎉 All TimeWeave Automated Tests Passed Cleanly!');
console.log('====================================================');
