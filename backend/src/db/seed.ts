import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './index';

export async function seedDemoData() {
  console.log('[TimeWeave Seed] Starting development demo data seeding...');

  await db.runMigrations();

  const demoEmail = 'demo@timeweave.app';
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [demoEmail]);

  if (existing.rows.length > 0) {
    console.log('[TimeWeave Seed] Demo user already exists. Removing existing demo records...');
    await db.query('DELETE FROM users WHERE email = $1', [demoEmail]);
  }

  const userId = uuidv4();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('demoPassword123!', salt);
  const today = new Date().toISOString().split('T')[0];

  // 1. Create demo user
  await db.query(
    `INSERT INTO users (id, name, email, password_hash, role, timezone, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, 'Demo User', demoEmail, passwordHash, 'Professional', 'Asia/Kolkata', 'TimeWeave Demo Account']
  );

  // 2. Create user preferences
  await db.query(
    `INSERT INTO user_preferences (
      user_id, working_days, work_start_time, work_end_time,
      daily_capacity_minutes, break_duration, max_continuous_work_minutes,
      energy_preference, preferred_planning_horizon
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      userId,
      JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      '09:00',
      '18:00',
      480,
      30,
      120,
      'Morning',
      'Daily'
    ]
  );

  // 3. Create 6 realistic sample tasks
  const sampleTasks = [
    {
      id: uuidv4(),
      title: 'Deep Learning Paper Review',
      description: 'Review attention mechanisms and transformer architecture variants',
      category: 'Study',
      priority: 'High',
      status: 'Pending',
      deadline: `${today} 17:00:00`,
      estimated: 90,
      predicted: 75,
      actual: 0,
      energy: 'High',
      completed_at: null
    },
    {
      id: uuidv4(),
      title: 'API Gateway Implementation',
      description: 'Refactor Express route middleware and add Supertest integration suites',
      category: 'Work',
      priority: 'High',
      status: 'In Progress',
      deadline: `${today} 18:30:00`,
      estimated: 120,
      predicted: 110,
      actual: 30,
      energy: 'High',
      completed_at: null
    },
    {
      id: uuidv4(),
      title: 'Cardio and Mobility Session',
      description: '30m interval running and 15m core recovery stretching',
      category: 'Health',
      priority: 'Medium',
      status: 'Pending',
      deadline: `${today} 20:00:00`,
      estimated: 45,
      predicted: 45,
      actual: 0,
      energy: 'Medium',
      completed_at: null
    },
    {
      id: uuidv4(),
      title: 'Quarterly Budget Planning',
      description: 'Reconcile freelance invoicing and personal investment allocations',
      category: 'Personal',
      priority: 'Low',
      status: 'Pending',
      deadline: `${today} 21:00:00`,
      estimated: 60,
      predicted: 50,
      actual: 0,
      energy: 'Low',
      completed_at: null
    },
    {
      id: uuidv4(),
      title: 'System Architecture Wireframing',
      description: 'Design responsive layout grid and mobile drawer navigation flows',
      category: 'Work',
      priority: 'High',
      status: 'Completed',
      deadline: `${today} 12:00:00`,
      estimated: 90,
      predicted: 85,
      actual: 80,
      energy: 'High',
      completed_at: `${today} 11:30:00`
    },
    {
      id: uuidv4(),
      title: 'PostgreSQL Migration & Schema Audit',
      description: 'Verify foreign keys, cascading deletes, and parameter bindings',
      category: 'Work',
      priority: 'Medium',
      status: 'Completed',
      deadline: `${today} 14:00:00`,
      estimated: 60,
      predicted: 65,
      actual: 70,
      energy: 'Medium',
      completed_at: `${today} 13:45:00`
    }
  ];

  for (const t of sampleTasks) {
    await db.query(
      `INSERT INTO tasks (
        id, user_id, title, description, category, priority, status,
        deadline, user_estimated_minutes, current_predicted_minutes,
        actual_duration_minutes, energy_requirement, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        t.id,
        userId,
        t.title,
        t.description,
        t.category,
        t.priority,
        t.status,
        t.deadline,
        t.estimated,
        t.predicted,
        t.actual,
        t.energy,
        t.completed_at
      ]
    );

    // Record model prediction provenance
    await db.query(
      `INSERT INTO model_predictions (
        id, user_id, task_id, predicted_minutes, baseline_minutes,
        confidence_lower, confidence_upper, model_version, prediction_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuidv4(),
        userId,
        t.id,
        t.predicted,
        t.estimated,
        Math.round(t.predicted * 0.85),
        Math.round(t.predicted * 1.15),
        'model-randomforest-v1.0',
        'ml_personalized'
      ]
    );

    // Record history event
    await db.query(
      `INSERT INTO task_history (id, user_id, task_id, event_type, event_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        uuidv4(),
        userId,
        t.id,
        t.status === 'Completed' ? 'task_completed' : 'task_created',
        JSON.stringify({
          title: t.title,
          category: t.category,
          estimated: t.estimated,
          actual: t.actual
        })
      ]
    );
  }

  // 4. Create sample schedule version & blocks
  const scheduleId = uuidv4();
  await db.query(
    `INSERT INTO schedule_versions (
      id, user_id, target_date, version_number, status,
      total_planned_minutes, utilization_percentage, accepted_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
    [scheduleId, userId, today, 1, 'accepted', 255, 68]
  );

  const sampleBlocks = [
    { title: 'Deep Learning Paper Review', start: '09:00', end: '10:15', dur: 75, type: 'task', cat: 'Study', prio: 'High' },
    { title: 'Morning Restorative Break', start: '10:15', end: '10:30', dur: 15, type: 'break', cat: 'Break', prio: 'Low' },
    { title: 'API Gateway Implementation', start: '10:30', end: '12:20', dur: 110, type: 'task', cat: 'Work', prio: 'High' },
    { title: 'Nutritional Lunch Break', start: '12:30', end: '13:15', dur: 45, type: 'break', cat: 'Break', prio: 'Low' },
    { title: 'Cardio and Mobility Session', start: '17:30', end: '18:15', dur: 45, type: 'task', cat: 'Health', prio: 'Medium' }
  ];

  for (const b of sampleBlocks) {
    await db.query(
      `INSERT INTO schedule_blocks (
        id, schedule_version_id, title, start_at, end_at,
        duration_minutes, block_type, category, priority, is_fixed, reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        uuidv4(),
        scheduleId,
        b.title,
        b.start,
        b.end,
        b.dur,
        b.type,
        b.cat,
        b.prio,
        b.type === 'break',
        b.type === 'break' ? 'Scheduled recovery interval' : 'Optimized by energy & priority'
      ]
    );
  }

  // 5. Create notifications
  await db.query(
    `INSERT INTO notifications (id, user_id, type, title, message, link_route, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      uuidv4(),
      userId,
      'system',
      'Welcome to TimeWeave Demo 🎉',
      'Demo environment seeded with realistic schedule blocks, historical calibration data, and task metrics.',
      '/dashboard',
      false
    ]
  );

  console.log('[TimeWeave Seed] Demo data seeded successfully:');
  console.log('  Email: demo@timeweave.app');
  console.log('  Password: demoPassword123!');
  console.log('  Tasks created: 6 (4 active, 2 completed)');
}

if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[TimeWeave Seed Error]:', err);
      process.exit(1);
    });
}
