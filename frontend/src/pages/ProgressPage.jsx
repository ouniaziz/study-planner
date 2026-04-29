import { useEffect, useState } from 'react';
import { getStats } from '../api/statsApi';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { Loader2, Flame, Trophy, TrendingUp, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector
} from 'recharts';

const COLORS = ['#7C3AED', '#06B6D4', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444'];

const MILESTONES = [
  { hours: 1,   emoji: '🌱', label: 'First Session',    color: 'text-green-400'  },
  { hours: 10,  emoji: '📚', label: '10h Studied',      color: 'text-blue-400'   },
  { hours: 25,  emoji: '⚡', label: '25h Grinder',      color: 'text-amber-400'  },
  { hours: 50,  emoji: '🏆', label: '50h Champion',     color: 'text-yellow-400' },
  { hours: 100, emoji: '🚀', label: '100h Legend',      color: 'text-purple-400' },
  { hours: 200, emoji: '💎', label: '200h Diamond',     color: 'text-accent-cyan'},
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-3 text-xs shadow-card">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const ActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#F1F5F9" className="text-sm" fontSize={14} fontWeight={600}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94A3B8" fontSize={12}>
        {(percent * 100).toFixed(0)}%
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

export default function ProgressPage() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    getStats()
      .then(r => setStats(r.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout><div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div></Layout>
  );

  const totalHours = stats ? Math.round(stats.totalStudyTimeMinutes / 60) : 0;
  const barData    = (stats?.subjectsProgress ?? []).map(s => ({
    name:      s.subjectName.length > 12 ? s.subjectName.slice(0, 12) + '…' : s.subjectName,
    Completed: s.completedSessions,
    Total:     s.totalSessions,
  }));
  const pieData = (stats?.subjectsProgress ?? [])
    .filter(s => s.completedSessions > 0)
    .map(s => ({ name: s.subjectName, value: s.completedSessions }));

  const unlockedMilestones = MILESTONES.filter(m => totalHours >= m.hours);

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle">Track your achievements and study patterns</p>
        </div>

        {/* Top stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: TrendingUp, label: 'Completion Rate', value: `${stats?.completionRate ?? 0}%`, color: 'text-green-400 bg-green-500/10' },
            { icon: Clock,      label: 'Study Hours',     value: `${totalHours}h`,                  color: 'text-accent-cyan bg-accent-cyan/10' },
            { icon: Flame,      label: 'Day Streak',      value: `${stats?.streak ?? 0}d`,          color: 'text-amber-400 bg-amber-500/10' },
            { icon: Trophy,     label: 'Milestones',      value: `${unlockedMilestones.length}/${MILESTONES.length}`, color: 'text-primary bg-primary/10' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card-hover flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-5 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Completed vs Total Sessions
            </h2>
            {barData.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 12 }} />
                  <Bar dataKey="Total"     fill="#2A2A4A" radius={[4,4,0,0]} />
                  <Bar dataKey="Completed" fill="#7C3AED" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>

          {/* Pie chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-5 flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Time Distribution by Subject
            </h2>
            {pieData.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={<ActiveShape />}
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* Streak & Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Streak display */}
          <div className="card text-center">
            <div className="flex items-center gap-2 justify-center mb-4">
              <Flame size={18} className="text-amber-400" />
              <h2 className="text-lg font-semibold text-text-primary">Study Streak</h2>
            </div>
            <div className="relative inline-block mb-3">
              <div className="w-28 h-28 rounded-full border-4 border-amber-400/40 flex flex-col items-center justify-center
                              shadow-[0_0_30px_rgba(245,158,11,0.25)]">
                <span className="text-4xl font-black text-amber-400">{stats?.streak ?? 0}</span>
                <span className="text-xs text-text-muted font-medium">days</span>
              </div>
            </div>
            <p className="text-text-secondary text-sm">
              {stats?.streak === 0
                ? 'Complete a session today to start your streak!'
                : stats?.streak === 1
                  ? '🔥 You\'re on fire! Keep going!'
                  : `🔥 Amazing! ${stats.streak} consecutive days of studying!`}
            </p>
          </div>

          {/* Milestone badges */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-text-primary">Milestones</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MILESTONES.map(m => {
                const unlocked = totalHours >= m.hours;
                return (
                  <div key={m.hours}
                    className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-300
                      ${unlocked
                        ? 'bg-primary/10 border-primary/25 shadow-glow-sm'
                        : 'bg-bg-elevated border-bg-border opacity-40 grayscale'
                      }`}>
                    <span className="text-2xl mb-1">{m.emoji}</span>
                    <span className={`text-xs font-semibold ${unlocked ? m.color : 'text-text-muted'}`}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[240px] text-text-muted text-sm">
      Complete sessions to see your stats here.
    </div>
  );
}
