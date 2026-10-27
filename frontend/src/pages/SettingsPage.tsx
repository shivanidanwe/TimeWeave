import React, { useState } from 'react';
import {
  User,
  Sliders,
  Bell,
  Link as LinkIcon,
  Moon,
  Shield,
  CreditCard,
  Camera,
  CheckCircle2,
  Trash2,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const SettingsPage: React.FC = () => {
  const { user, preferences, updatePreferences, refreshUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'privacy'>('profile');

  // Profile Form state
  const [name, setName] = useState(user?.name || 'Shivani Damre');
  const [role, setRole] = useState(user?.role || 'Student');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [bio, setBio] = useState('B.Tech CSE Student | AI/ML enthusiast');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Preferences Form state
  const [startTime, setStartTime] = useState(preferences?.work_start_time || '09:00');
  const [endTime, setEndTime] = useState(preferences?.work_end_time || '18:00');
  const [breakDuration, setBreakDuration] = useState(preferences?.break_duration || 30);
  const [energyPreference, setEnergyPreference] = useState(preferences?.energy_preference || 'Morning');
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.updateProfile({ name, role, timezone, bio });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    try {
      await updatePreferences({
        work_start_time: startTime,
        work_end_time: endTime,
        break_duration: breakDuration,
        energy_preference: energyPreference as any
      });
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your account profile, working preferences, and ML calibration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Settings Sidebar Menu (Screen 12) */}
        <div className="lg:col-span-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm space-y-1 h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition text-left ${
                  isActive
                    ? 'bg-indigo-50 text-[#6366F1]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Content Form (Screen 12) */}
        <div className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Profile Information</h2>
                <p className="text-xs text-slate-500">Update your account profile details and bio.</p>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {/* Avatar Section matching Screen 12 */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#6366F1] to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow">
                  {name ? name[0].toUpperCase() : 'S'}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">{name}</span>
                  <span className="text-xs text-slate-500 block mb-2">{user?.email || 'shivani@example.com'}</span>
                  <button
                    type="button"
                    onClick={() => alert('Photo upload dialog')}
                    className="text-xs font-semibold text-[#6366F1] hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Photo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || 'shivani@example.com'}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Student">Student</option>
                    <option value="Professional">Professional</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Time Zone
                  </label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bio / Focus Description
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Working Preferences</h2>
                <p className="text-xs text-slate-500">
                  Control constraints used by the AI scheduling and optimizer engine.
                </p>
              </div>

              {prefsSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Preferences saved successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start of Work Day
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End of Work Day
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Energy Preference
                  </label>
                  <select
                    value={energyPreference}
                    onChange={(e: any) => setEnergyPreference(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Morning">Morning (Peak 9 AM - 12 PM)</option>
                    <option value="Afternoon">Afternoon (Peak 1 PM - 5 PM)</option>
                    <option value="Evening">Evening (Peak 6 PM - 10 PM)</option>
                    <option value="Flexible">Flexible / Even</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Break Duration
                  </label>
                  <select
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPrefs}
                  className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSavingPrefs ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Notification Preferences
              </h2>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded text-[#6366F1] focus:ring-indigo-500" />
                  <span>In-app reminders for upcoming deadlines</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded text-[#6366F1] focus:ring-indigo-500" />
                  <span>Overcommitment warnings when daily workload exceeds capacity</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded text-[#6366F1] focus:ring-indigo-500" />
                  <span>Daily schedule morning digest and focus recommendations</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Privacy & ML Data</h2>
                <p className="text-xs text-slate-500">
                  TimeWeave learns from your task history locally to personalize duration regression estimates.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase">Clear Machine Learning History</h3>
                <p className="text-xs text-slate-600">
                  Resetting duration calibration history will revert estimates to baseline category heuristics.
                </p>
                <button
                  onClick={() => alert('Model calibration reset to baseline.')}
                  className="px-4 py-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Clear Model Calibration Data
                </button>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-rose-800 uppercase">Danger Zone</h3>
                <p className="text-xs text-rose-700">
                  Permanently delete your account and all associated tasks, schedules, and analytics.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to permanently delete your TimeWeave account?')) {
                      api.deleteAccount().then(() => logout());
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Delete Account Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
