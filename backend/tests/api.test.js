const assert = require('assert');

async function runTests() {
  console.log('--- Starting TimeWeave Backend Integration Tests ---');

  // Test 1: Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  assert.strictEqual(healthRes.status, 200, 'Health check should return 200');
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'ok', 'Status should be ok');
  console.log('✓ Test 1 Passed: GET /api/health returned 200 OK');

  // Test 2: ML Service health check
  const mlHealthRes = await fetch('http://127.0.0.1:8000/health');
  assert.strictEqual(mlHealthRes.status, 200, 'ML Service health should return 200');
  const mlHealthData = await mlHealthRes.json();
  assert.strictEqual(mlHealthData.status, 'healthy');
  console.log('✓ Test 2 Passed: GET /health on ML Service returned healthy');

  // Test 3: User Registration with unique email
  const testEmail = `test_${Date.now()}@example.com`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Integration Test User',
      email: testEmail,
      password: 'securePassword123!',
      role: 'Professional'
    })
  });
  assert.strictEqual(regRes.status, 201, 'Register should return 201');
  const regData = await regRes.json();
  assert.ok(regData.token, 'Should return JWT token');
  console.log('✓ Test 3 Passed: POST /api/auth/register successfully issued JWT');

  const token = regData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Test 4: Auth protection & GET /api/auth/me
  const meRes = await fetch('http://localhost:5000/api/auth/me', { headers: authHeaders });
  assert.strictEqual(meRes.status, 200, 'Get me should return 200');
  const meData = await meRes.json();
  assert.strictEqual(meData.user.email, testEmail);
  console.log('✓ Test 4 Passed: GET /api/auth/me verified authenticated user');

  // Test 5: Task creation with ML duration prediction
  const taskRes = await fetch('http://localhost:5000/api/tasks', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Complete System Verification',
      description: 'End-to-end testing of TimeWeave APIs',
      category: 'Work',
      priority: 'High',
      energy_requirement: 'High',
      user_estimated_minutes: 75
    })
  });
  assert.strictEqual(taskRes.status, 201, 'Task creation should return 201');
  const taskData = await taskRes.json();
  assert.ok(taskData.task.id, 'Created task should have an ID');
  assert.ok(taskData.task.current_predicted_minutes > 0, 'Task should have predicted minutes');
  console.log('✓ Test 5 Passed: POST /api/tasks created task with duration prediction');

  // Test 6: Schedule generation with constraint scheduler
  const schedRes = await fetch('http://localhost:5000/api/schedules/generate', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ target_date: '2026-09-25' })
  });
  assert.strictEqual(schedRes.status, 200, 'Schedule generation should return 200');
  const schedData = await schedRes.json();
  assert.ok(schedData.scheduled_blocks.length > 0, 'Should have scheduled blocks');
  console.log('✓ Test 6 Passed: POST /api/schedules/generate produced constraint schedule');

  // Test 7: Task completion
  const compRes = await fetch(`http://localhost:5000/api/tasks/${taskData.task.id}/complete`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ actual_duration_minutes: 80 })
  });
  assert.strictEqual(compRes.status, 200, 'Task completion should return 200');
  console.log('✓ Test 7 Passed: POST /api/tasks/:id/complete logged actual duration & prediction error');

  console.log('\n--- All 7 Backend Integration Tests Passed Successfully! ---');
}

runTests().catch(err => {
  console.error('Integration tests failed:', err);
  process.exit(1);
});
