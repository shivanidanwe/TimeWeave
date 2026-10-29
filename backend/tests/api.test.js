const assert = require('assert');
const http = require('http');

async function runAllTests() {
  console.log('====================================================');
  console.log('  TimeWeave Backend REST API Test Suite');
  console.log('====================================================\n');

  // Load app in-process
  require('dotenv').config();
  const { default: app } = require('../dist/server.js');
  const { db } = require('../dist/db/index.js');

  await db.runMigrations();

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Harness] In-process server listening on port ${port}`);

  try {
    // Test 1: Health check
    console.log('[Test 1/12] GET /health...');
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok');
    console.log('✓ Health check passed');

    // Test 2: User registration with validation
    console.log('[Test 2/12] POST /auth/register...');
    const user1Email = `user1_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User One',
        email: user1Email,
        password: 'Password123!',
        role: 'Professional'
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    assert.ok(regData.token, 'Should issue JWT token');
    const token1 = regData.token;
    const authHeaders1 = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    };
    console.log('✓ Registration passed');

    // Test 3: Duplicate account rejection
    console.log('[Test 3/12] Reject duplicate email registration...');
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: user1Email,
        password: 'Password123!'
      })
    });
    assert.strictEqual(dupRes.status, 409, 'Duplicate email should be rejected with 409');
    console.log('✓ Duplicate registration prevention passed');

    // Test 4: Unauthenticated and invalid token rejection
    console.log('[Test 4/12] Protected route authorization check...');
    const unauthRes = await fetch(`${baseUrl}/auth/me`);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request should return 401');

    const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders1 });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.user.email, user1Email);
    console.log('✓ Auth token verification & /auth/me passed');

    // Test 5: User 2 registration for Data Isolation Tests
    console.log('[Test 5/12] Multi-user data isolation test...');
    const user2Email = `user2_${Date.now()}@example.com`;
    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'User Two',
        email: user2Email,
        password: 'Password123!',
        role: 'Student'
      })
    });
    const regData2 = await regRes2.json();
    const token2 = regData2.token;
    const authHeaders2 = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token2}`
    };

    // User 1 creates a private task
    const task1Res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        title: 'User 1 Confidential Strategy',
        category: 'Work',
        priority: 'High',
        user_estimated_minutes: 90
      })
    });
    assert.strictEqual(task1Res.status, 201);
    const task1Data = await task1Res.json();
    const taskId1 = task1Data.task.id;

    // User 2 attempts to fetch User 1's task directly
    const leakRes = await fetch(`${baseUrl}/tasks/${taskId1}`, { headers: authHeaders2 });
    assert.strictEqual(leakRes.status, 404, 'User 2 should not be able to read User 1 task');

    // User 2 attempts to delete User 1's task
    const delLeakRes = await fetch(`${baseUrl}/tasks/${taskId1}`, { method: 'DELETE', headers: authHeaders2 });
    assert.strictEqual(delLeakRes.status, 404, 'User 2 should not be able to delete User 1 task');

    // User 2 task list should be completely empty
    const u2TasksRes = await fetch(`${baseUrl}/tasks`, { headers: authHeaders2 });
    const u2Tasks = await u2TasksRes.json();
    assert.strictEqual(u2Tasks.tasks.length, 0, 'User 2 task list should be strictly isolated');
    console.log('✓ Multi-user data isolation strictly verified');

    // Test 6: Task CRUD Operations for User 1
    console.log('[Test 6/12] Task CRUD (Create, Read, Update, Delete)...');
    // Update task
    const updateRes = await fetch(`${baseUrl}/tasks/${taskId1}`, {
      method: 'PATCH',
      headers: authHeaders1,
      body: JSON.stringify({
        title: 'User 1 Updated Strategy',
        priority: 'Critical'
      })
    });
    assert.strictEqual(updateRes.status, 200);

    // Verify update
    const readUpdated = await fetch(`${baseUrl}/tasks/${taskId1}`, { headers: authHeaders1 });
    const updatedData = await readUpdated.json();
    assert.strictEqual(updatedData.task.title, 'User 1 Updated Strategy');
    assert.strictEqual(updatedData.task.priority, 'Critical');
    console.log('✓ Task CRUD & PATCH updates verified');

    // Test 7: Task Completion with actual duration logging
    console.log('[Test 7/12] POST /tasks/:id/complete...');
    const compRes = await fetch(`${baseUrl}/tasks/${taskId1}/complete`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ actual_duration_minutes: 85 })
    });
    assert.strictEqual(compRes.status, 200);
    const compData = await compRes.json();
    assert.strictEqual(compData.actual_duration_minutes, 85);
    console.log('✓ Task completion and actual duration logging passed');

    // Test 8: User Preferences updates
    console.log('[Test 8/12] GET & PUT /preferences...');
    const prefUpdateRes = await fetch(`${baseUrl}/preferences`, {
      method: 'PUT',
      headers: authHeaders1,
      body: JSON.stringify({
        work_start_time: '08:30',
        work_end_time: '17:30',
        energy_preference: 'Morning',
        break_duration: 25
      })
    });
    assert.strictEqual(prefUpdateRes.status, 200);

    const getPrefRes = await fetch(`${baseUrl}/preferences`, { headers: authHeaders1 });
    const prefData = await getPrefRes.json();
    assert.strictEqual(prefData.preferences.work_start_time, '08:30');
    assert.strictEqual(prefData.preferences.break_duration, 25);
    console.log('✓ User preferences persistence passed');

    // Test 9: Schedule generation & preview
    console.log('[Test 9/12] POST /schedules/generate & POST /schedules/:id/accept...');
    // Create 2 tasks for scheduling
    await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ title: 'Task A', category: 'Study', priority: 'High', user_estimated_minutes: 60 })
    });
    await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ title: 'Task B', category: 'Work', priority: 'Medium', user_estimated_minutes: 90 })
    });

    const schedRes = await fetch(`${baseUrl}/schedules/generate`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ target_date: new Date().toISOString().split('T')[0] })
    });
    assert.strictEqual(schedRes.status, 200);
    const schedData = await schedRes.json();
    assert.ok(schedData.schedule_version_id, 'Should generate draft version ID');
    assert.ok(schedData.scheduled_blocks.length > 0, 'Should schedule blocks');

    // Accept schedule
    const acceptRes = await fetch(`${baseUrl}/schedules/${schedData.schedule_version_id}/accept`, {
      method: 'POST',
      headers: authHeaders1
    });
    assert.strictEqual(acceptRes.status, 200);
    console.log('✓ Schedule constraint generation and acceptance passed');

    // Test 10: Focus Mode Sessions
    console.log('[Test 10/12] POST & GET /focus/sessions...');
    const focusRes = await fetch(`${baseUrl}/focus/sessions`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        duration_minutes: 25,
        session_status: 'completed'
      })
    });
    assert.strictEqual(focusRes.status, 201);

    const getFocusRes = await fetch(`${baseUrl}/focus/sessions`, { headers: authHeaders1 });
    assert.strictEqual(getFocusRes.status, 200);
    const focusData = await getFocusRes.json();
    assert.ok(focusData.sessions.length > 0);
    console.log('✓ Focus session recording passed');

    // Test 11: Analytics calculations
    console.log('[Test 11/12] Analytics calculation verification...');
    const overviewRes = await fetch(`${baseUrl}/analytics/overview`, { headers: authHeaders1 });
    assert.strictEqual(overviewRes.status, 200);
    const overviewData = await overviewRes.json();
    assert.ok(overviewData.productivity_score >= 0);
    assert.strictEqual(overviewData.has_data, true);

    const workloadRes = await fetch(`${baseUrl}/analytics/workload`, { headers: authHeaders1 });
    assert.strictEqual(workloadRes.status, 200);
    const workloadData = await workloadRes.json();
    assert.ok(Array.isArray(workloadData.time_distribution));
    console.log('✓ Analytics endpoints passed with genuine calculated data');

    // Test 12: In-app notifications
    console.log('[Test 12/12] Notifications read & mark-as-read...');
    const notifRes = await fetch(`${baseUrl}/notifications`, { headers: authHeaders1 });
    assert.strictEqual(notifRes.status, 200);
    const notifData = await notifRes.json();
    assert.ok(notifData.notifications.length > 0, 'Should have received system notifications');

    const markReadRes = await fetch(`${baseUrl}/notifications/all/read`, {
      method: 'PATCH',
      headers: authHeaders1
    });
    assert.strictEqual(markReadRes.status, 200);
    console.log('✓ Notification read/unread state changes passed');

    console.log('\n====================================================');
    console.log('  🎉 All 12 Backend REST API Tests Passed Cleanly!');
    console.log('====================================================');
    server.close();
    await db.close();
    process.exit(0);
  } finally {
    try {
      server.close();
      await db.close();
    } catch (e) {}
  }
}

runAllTests().catch(err => {
  console.error('\n❌ Backend API Test Suite Failed:', err);
  process.exit(1);
});
