export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  timezone: string;
  avatar_url?: string;
  created_at?: string;
}

export interface UserPreferences {
  user_id?: string;
  working_days: string[];
  work_start_time: string;
  work_end_time: string;
  daily_capacity_minutes: number;
  break_duration: number;
  max_continuous_work_minutes: number;
  energy_preference: 'Morning' | 'Afternoon' | 'Evening' | 'Flexible';
  preferred_planning_horizon: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: 'Study' | 'Work' | 'Personal' | 'Health' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed';
  deadline?: string;
  user_estimated_minutes: number;
  current_predicted_minutes: number;
  actual_duration_minutes: number;
  energy_requirement: 'Low' | 'Medium' | 'High';
  flexibility: 'Flexible' | 'Fixed';
  is_active_timer: boolean | number;
  timer_started_at?: string;
  created_at: string;
  completed_at?: string;
  dependencies?: string[];
  prediction?: {
    predicted_minutes: number;
    baseline_minutes: number;
    confidence_lower: number;
    confidence_upper: number;
    prediction_source: string;
    model_version: string;
    explanations: string[];
  };
}

export interface ScheduleBlock {
  id?: string;
  task_id?: string | null;
  title: string;
  start_at: string; // "09:00"
  end_at: string;   // "10:30"
  start_time_display?: string;
  end_time_display?: string;
  duration_minutes: number;
  block_type: 'task' | 'break' | 'lunch' | 'fixed';
  category?: string;
  priority?: string;
  energy_requirement?: string;
  is_fixed: boolean;
  reason?: string;
}

export interface ScheduleVersion {
  id: string;
  user_id: string;
  target_date: string;
  version_number: number;
  status: 'draft' | 'accepted' | 'archived';
  total_planned_minutes: number;
  utilization_percentage: number;
  created_at: string;
  accepted_at?: string;
}

export interface ScheduleGenerationResult {
  schedule_version_id: string;
  version_number: number;
  target_date: string;
  status: 'Available Capacity' | 'Near Capacity' | 'Overcommitted';
  utilization_percentage: number;
  total_day_minutes: number;
  planned_work_minutes: number;
  break_minutes: number;
  free_capacity_minutes: number;
  overload_minutes: number;
  scheduled_blocks: ScheduleBlock[];
  unscheduled_tasks: any[];
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action_type: string;
    impact?: string;
  }>;
}

export interface DashboardOverview {
  tasks_today: number;
  completed_today: number;
  focus_time_minutes: number;
  focus_time_display: string;
  productivity_score: number;
  weekly_overview: Array<{
    day: string;
    planned: number;
    actual: number;
  }>;
  ai_insight: string;
}

export interface AnalyticsData {
  productivity_percentage: number;
  total_focus_hours: number;
  task_completion_rate: number;
  time_saved_hours: number;
  time_distribution: Array<{
    name: string;
    value: number;
    hours: number;
    color: string;
  }>;
  completion_trend: Array<{
    date: string;
    completionRate: number;
    tasksCompleted: number;
  }>;
  insights: Array<{
    id: string;
    title: string;
    description: string;
    impact: string;
  }>;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_route?: string;
  is_read: boolean | number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: Array<{
    label: string;
    action: string;
    schedule?: any;
  }>;
}
