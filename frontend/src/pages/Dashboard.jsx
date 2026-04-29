import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../api/statsApi';
import { getSessions } from '../api/plannerApi';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  Trophy, Flame, Clock, CheckCircle2, BookOpen,
  CalendarPlus, Plus, TrendingUp, Loader2, AlertCircle
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card-hover flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function getDateLabel(dateStr) {
  const d = parseISO(dateStr);
  if (isToday(d))    return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

function statusBadge(status) {
  const map = {
    PLANNED:   'badge-planned',
    COMPLETED: 'badge-completed',
    MISSED:    'badge-missed',
  };
  return map[status] ?? 'badge-planned';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]       = useState(null);
  const [sessions, setSessions] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getSessions()])
      .then(([statsRes, sessionsRes]) => {
        setStats(statsRes.data);
        setSessions(sessionsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Collect upcoming sessions for next 7 days
  const upcomingSessions = Object.entries(sessions)
    .flatMap(([date, list]) => list.map(s => ({ ...s, date })))
    .filter(s => s.status === 'PLANNED')
    .slice(0, 8);

  if (loading) return (
    <Layout><div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div></Layout>
  );

  const totalHours = stats ? Math.round(stats.totalStudyTimeMinutes / 60) : 0;

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="page-header flex items-start justify-between">
          <div>
            <h1 className="page-title">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋
            </h1>
            <p className="page-subtitle">{user?.email} — here's your study overview</p>
          </div>
          <div className="flex gap-3">
            <button id="dashboard-add-subject" onClick={() => navigate('/subjects')}
              className="btn-secondary flex items-center gap-2">
              <Plus size={16} /> Add Subject
            </button>
            <button id="dashboard-generate-plan" onClick={() => navigate('/planner')}
              className="btn-primary flex items-center gap-2">
              <CalendarPlus size={16} /> Generate Plan
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={CheckCircle2} label="Completion Rate"
              value={`${stats.completionRate}%`} sub="of all sessions"
              color="bg-green-500/10 text-green-400" />
            <StatCard icon={Clock} label="Total Study Time"
              value={`${totalHours}h`} sub={`${stats.totalStudyTimeMinutes} minutes`}
              color="bg-accent-cyan/10 text-accent-cyan" />
            <StatCard icon={Flame} label="Day Streak"
              value={stats.streak} sub={stats.streak === 1 ? 'day in a row' : 'days in a row'}
              color="bg-amber-500/10 text-amber-400" />
            <StatCard icon={BookOpen} label="Subjects"
              value={stats.subjectsProgress?.length ?? 0} sub="being tracked"
              color="bg-primary/10 text-primary" />
          </div>
        )}

        {/* Subject Progress + Upcoming Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Progress */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Subject Progress</h2>
            </div>
            {stats?.subjectsProgress?.length ? (
              <div className="space-y-4">
                {stats.subjectsProgress.map(s => (
                  <div key={s.subjectId}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-text-primary font-medium">{s.subjectName}</span>
                      <span className="text-text-muted">{s.completedSessions}/{s.totalSessions}</span>
                    </div>
                    <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-primary transition-all duration-700"
                        style={{ width: `${s.progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted mt-1">{s.progressPercent}% complete</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={BookOpen} title="No subjects yet"
                desc="Add subjects and generate a plan to see progress." />
            )}
          </div>

          {/* Upcoming Sessions */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <CalendarPlus size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Upcoming Sessions</h2>
            </div>
            {upcomingSessions.length ? (
              <div className="space-y-3">
                {upcomingSessions.map(s => (
                  <div key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-bg-border
                               hover:border-primary/30 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{s.subjectName}</p>
                        <p className="text-xs text-text-muted">
                          {getDateLabel(s.date)} · {s.startTime ? s.startTime.slice(0,5) : '—'} · {s.duration}min
                        </p>
                      </div>
                    </div>
                    <span className={statusBadge(s.status)}>{s.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={CalendarPlus} title="No upcoming sessions"
                desc="Generate a study plan to see your schedule here." />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center mb-3">
        <Icon size={22} className="text-text-muted" />
      </div>
      <p className="text-text-secondary font-medium">{title}</p>
      <p className="text-text-muted text-sm mt-1">{desc}</p>
    </div>
  );
}
