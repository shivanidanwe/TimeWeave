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
  const { buildFallbackSchedule } = require('../dist/controllers/scheduleController.js');
  const { handleChatMessage } = require('../dist/controllers/chatController.js');
  const { config } = require('../dist/config/env.js');

  await db.runMigrations();

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`[Test Harness] In-process server listening on port ${port}`);

  try {
    console.log('[Fallback regression] Deterministic schedule capacity check...');
    const fallbackSchedule = buildFallbackSchedule([
      { id: 'fallback-1', title: 'First task', priority: 'High', user_estimated_minutes: 45 },
      { id: 'fallback-2', title: 'Second task', priority: 'Medium', user_estimated_minutes: 45 }
    ], {
      work_start_time: '09:00',
      work_end_time: '10:00',
      break_duration: 0
    }, '2026-10-30');
    assert.strictEqual(fallbackSchedule.status, 'Overcommitted');
    assert.strictEqual(fallbackSchedule.planned_work_minutes, 45);
    assert.strictEqual(fallbackSchedule.unscheduled_tasks.length, 1);
    assert.strictEqual(fallbackSchedule.utilization_percentage, 150);
    console.log('✓ Fallback reports real capacity and unscheduled work');

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

    // Test 10: Authenticated assistant context and all supported intents
    console.log('[Test 10/14] Assistant intent responses, validation, and user isolation...');
    const todayDate = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const assistantTasks = [
      { title: 'Assistant today task', priority: 'High', deadline: todayDate, user_estimated_minutes: 45 },
      { title: 'Assistant overdue task', priority: 'Medium', deadline: yesterdayDate, user_estimated_minutes: 30 },
      { title: 'Assistant highest priority task', priority: 'Critical', user_estimated_minutes: 60 },
      { title: 'Assistant workload task', priority: 'Low', user_estimated_minutes: 480 }
    ];
    for (const task of assistantTasks) {
      const createRes = await fetch(`${baseUrl}/tasks`, {
        method: 'POST',
        headers: authHeaders1,
        body: JSON.stringify({ category: 'Work', ...task })
      });
      assert.strictEqual(createRes.status, 201);
    }

    const assistantPrompts = [
      ['What tasks do I have today?', 'Assistant today task'],
      ['Which tasks are overdue?', 'Assistant overdue task'],
      ['What is my total pending workload?', 'active task'],
      ['Am I overcommitted today?', 'capacity'],
      ['Which task should I prioritize?', 'Assistant highest priority task'],
      ['Generate a schedule for today.', 'Schedule preview'],
      ['How much time should I allocate to each task?', 'Schedule preview'],
      ['How many tasks have I completed?', 'completed'],
      ['What is my average task duration?', 'average recorded task duration'],
      ['How can I improve my productivity?', 'last 7 days'],
      ['I want to focus on my highest-priority task.', 'Assistant highest priority task']
    ];
    for (const [message, expectedText] of assistantPrompts) {
      const chatRes = await fetch(`${baseUrl}/assistant/chat`, {
        method: 'POST',
        headers: authHeaders1,
        body: JSON.stringify({ message })
      });
      assert.strictEqual(chatRes.status, 200, `Assistant request failed for: ${message}`);
      const chatData = await chatRes.json();
      assert.strictEqual(chatData.success, true);
      assert.ok(chatData.reply.toLowerCase().includes(expectedText.toLowerCase()), `Unexpected answer for: ${message}\n${chatData.reply}`);
      assert.ok(Array.isArray(chatData.suggestions));
    }

    const originalMlServiceUrl = config.mlServiceUrl;
    config.mlServiceUrl = 'http://127.0.0.1:1';
    const offlineScheduleRes = await fetch(`${baseUrl}/assistant/chat`, {
      method: 'POST', headers: authHeaders1, body: JSON.stringify({ message: 'Generate a schedule for today.' })
    });
    const offlineSchedule = await offlineScheduleRes.json();
    config.mlServiceUrl = originalMlServiceUrl;
    assert.strictEqual(offlineSchedule.success, true);
    assert.strictEqual(offlineSchedule.schedule.source, 'local_fallback');
    assert.ok(offlineSchedule.reply.includes('scheduling service is unavailable'));

    const emptyChatRes = await fetch(`${baseUrl}/assistant/chat`, {
      method: 'POST', headers: authHeaders1, body: JSON.stringify({ message: '   ' })
    });
    assert.strictEqual(emptyChatRes.status, 400);
    const invalidChatRes = await fetch(`${baseUrl}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer invalid-token' },
      body: JSON.stringify({ message: 'What tasks do I have today?' })
    });
    assert.strictEqual(invalidChatRes.status, 403);

    const userTwoChatRes = await fetch(`${baseUrl}/assistant/chat`, {
      method: 'POST', headers: authHeaders2, body: JSON.stringify({ message: 'What tasks do I have today?' })
    });
    const userTwoChat = await userTwoChatRes.json();
    assert.strictEqual(userTwoChat.success, true);
    assert.ok(!userTwoChat.reply.includes('Assistant today task'));
    assert.ok(userTwoChat.reply.includes('no active tasks'));

    const unknownChatRes = await fetch(`${baseUrl}/assistant/chat`, {
      method: 'POST', headers: authHeaders1, body: JSON.stringify({ message: 'Tell me a joke about the moon' })
    });
    const unknownChat = await unknownChatRes.json();
    assert.ok(unknownChat.reply.includes('I can answer questions about'));

    const originalQuery = db.query.bind(db);
    db.query = async () => { throw new Error('simulated database failure'); };
    const mockResponse = {
      statusCode: 200,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; }
    };
    await handleChatMessage({ user: { id: 'test-user' }, body: { message: 'What tasks do I have today?' } }, mockResponse);
    db.query = originalQuery;
    assert.strictEqual(mockResponse.statusCode, 500);
    assert.strictEqual(mockResponse.body.success, false);

    console.log('✓ Assistant intents, invalid input/token, empty user history, unknown prompts, and database failure passed');

    // Test 11: Focus Mode Sessions
    console.log('[Test 11/14] POST & GET /focus/sessions...');
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

    // Test 12: Analytics calculations
    console.log('[Test 12/14] Analytics calculation verification...');
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

    // Test 13: In-app notifications
    console.log('[Test 13/14] Notifications read & mark-as-read...');
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

    console.log('[Test 14/14] Legacy /chat compatibility...');
    const legacyChatRes = await fetch(`${baseUrl}/chat`, {
      method: 'POST', headers: authHeaders1, body: JSON.stringify({ message: 'What is my total pending workload?' })
    });
    assert.strictEqual(legacyChatRes.status, 200);
    assert.strictEqual((await legacyChatRes.json()).success, true);
    console.log('✓ Legacy chat route remains compatible');

    const cleanupRes1 = await fetch(`${baseUrl}/auth/account`, { method: 'DELETE', headers: authHeaders1 });
    const cleanupRes2 = await fetch(`${baseUrl}/auth/account`, { method: 'DELETE', headers: authHeaders2 });
    assert.strictEqual(cleanupRes1.status, 200);
    assert.strictEqual(cleanupRes2.status, 200);
    console.log('✓ Temporary integration-test accounts and records cleaned up');

    console.log('\n====================================================');
    console.log('  🎉 All Backend REST API Checks Passed Cleanly!');
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
