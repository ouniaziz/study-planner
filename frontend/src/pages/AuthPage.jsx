import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, register as registerApi } from '../api/authApi';
import toast from 'react-hot-toast';
import { GraduationCap, Sparkles, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    if (password.length < 6)  return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      const apiCall = mode === 'login' ? loginApi : registerApi;
      const { data } = await apiCall({ email, password });
      login(data);
      toast.success(mode === 'login' ? 'Welcome back! 👋' : 'Account created! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent-cyan/8 blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary shadow-glow-md mb-4 animate-float">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">
            AI Study <span className="gradient-text">Planner</span>
          </h1>
          <p className="text-text-secondary mt-2 flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            Smart schedules for smarter studying
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Tab toggle */}
          <div className="flex bg-bg-elevated rounded-xl p-1 mb-6 border border-bg-border">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 capitalize
                  ${mode === m
                    ? 'bg-primary text-white shadow-glow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                  }`}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <input
                id="auth-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button id="auth-submit" type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
                : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-primary hover:text-primary-light font-semibold transition-colors">
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
