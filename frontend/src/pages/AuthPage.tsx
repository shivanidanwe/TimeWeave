import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterInitial = location.pathname === '/register';
  const [isRegister, setIsRegister] = useState(isRegisterInitial);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      if (!name.trim()) {
        setError('Full name is required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      setIsLoading(true);
      try {
        await register({ name, email, password, role, timezone });
        navigate('/onboarding');
      } catch (err: any) {
        setError(err.message || 'Registration failed.');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !password) {
        setError('Please enter your email and password.');
        return;
      }

      setIsLoading(true);
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || 'Invalid email or password.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF]/40 flex flex-col justify-center items-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Brand Logo Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#818CF8] flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-slate-900">TimeWeave</span>
      </div>

      {/* Main Centered Auth Card (Screen 2) */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl shadow-indigo-500/5">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isRegister
              ? 'Join TimeWeave and optimize your daily schedule'
              : 'Login to continue to your account'}
          </p>
        </div>

        {/* Segmented Toggle: [Login] [Register] */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`py-2 rounded-lg transition ${
              !isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`py-2 rounded-lg transition ${
              isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Shivani Damre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isRegister}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => alert('Password reset link would be emailed.')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={isRegister}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  >
                    <option value="Student">Student</option>
                    <option value="Professional">Professional</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        {/* Social Login Options */}
        <div className="mt-6">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-xs text-slate-400 font-medium uppercase absolute">
              Or continue with
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => alert('Social sign-in with Google')}
              className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Social sign-in with GitHub')}
              className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              <svg className="w-4 h-4 fill-slate-800" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        </div>

        {/* Footer Toggle */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="text-[#6366F1] font-bold hover:underline"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="text-[#6366F1] font-bold hover:underline"
              >
                Sign up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
