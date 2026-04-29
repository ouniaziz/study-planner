import { useEffect, useState } from 'react';
import { generatePlan, getSessions, markComplete, markMissed, deleteSession } from '../api/plannerApi';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import {
  CalendarDays, Sparkles, Loader2, X, CheckCircle2,
  XCircle, Clock, ChevronLeft, ChevronRight, Settings2, Trash2
} from 'lucide-react';
import { format, parseISO, addDays, startOfToday } from 'date-fns';

const STATUS_MAP = {
  PLANNED:   { label: 'Planned',   cls: 'badge-planned'   },
  COMPLETED: { label: 'Completed', cls: 'badge-completed' },
  MISSED:    { label: 'Missed',    cls: 'badge-missed'    },
};

function GenerateModal({ onClose, onGenerated }) {
  const today = startOfToday().toISOString().split('T')[0];
  const [form, setForm]     = useState({ hoursPerDay: 4, startDate: today, planDays: 14 });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await generatePlan({ ...form, hoursPerDay: +form.hoursPerDay, planDays: +form.planDays });
      toast.success('Study plan generated! 🎉');
      onGenerated();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-text-primary">Generate Study Plan</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handle} className="space-y-5">
          <div>
            <label className="label">Hours per day</label>
            <input id="plan-hours" type="number" min="1" max="16" className="input"
              value={form.hoursPerDay} onChange={e => set('hoursPerDay', e.target.value)} />
            <p className="text-xs text-text-muted mt-1">How many hours you can study each day (1–16)</p>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input id="plan-start" type="date" className="input" min={today}
              value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Plan Duration (days)</label>
            <input id="plan-days" type="number" min="1" max="90" className="input"
              value={form.planDays} onChange={e => set('planDays', e.target.value)} />
            <p className="text-xs text-text-muted mt-1">How many days ahead to schedule (1–90)</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button id="plan-generate-btn" type="submit" disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionCard({ session, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const { label, cls } = STATUS_MAP[session.status] ?? STATUS_MAP.PLANNED;

  const update = async (action, isDelete = false) => {
    setLoading(true);
    try {
      console.log('Action executing for session:', session.id, action);
      await action(session.id);
      if (isDelete) toast.success('Session deleted');
      onUpdate();
    } catch (err) {
      console.error('Session update error:', err);
      toast.error(err?.response?.data?.message || 'Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200
      ${session.status === 'COMPLETED' ? 'bg-green-500/5 border-green-500/15' :
        session.status === 'MISSED'    ? 'bg-red-500/5 border-red-500/15' :
                                         'bg-bg-elevated border-bg-border hover:border-primary/30'}
    `}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary text-sm leading-tight break-words">{session.subjectName}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
            <span className="flex items-center gap-1"><Clock size={11} />{session.startTime?.slice(0,5) ?? '—'}</span>
            <span>{session.duration} min</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={cls}>{label}</span>
          <button id={`delete-${session.id}`}
             onClick={() => update(deleteSession, true)} disabled={loading}
             className="text-text-muted hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-all">
             <Trash2 size={13} />
          </button>
        </div>
      </div>

      {session.status === 'PLANNED' && (
        <div className="flex gap-2 mt-3">
          <button id={`complete-${session.id}`}
            onClick={() => update(markComplete)} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold
                       py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20
                       hover:bg-green-500/20 transition-all duration-200 disabled:opacity-50">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Done
          </button>
          <button id={`miss-${session.id}`}
            onClick={() => update(markMissed)} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold
                       py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20
                       hover:bg-red-500/20 transition-all duration-200 disabled:opacity-50">
            <XCircle size={12} />Missed
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  const [sessions, setSessions]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [weekStart, setWeekStart]   = useState(startOfToday());

  const fetchSessions = () => {
    getSessions()
      .then(r => setSessions(r.data))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchSessions, []);

  // Build 7 days from weekStart
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));

  const totalSessions = Object.values(sessions).flat().length;

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Study Planner</h1>
            <p className="page-subtitle">
              {totalSessions} sessions scheduled · Click a session to mark as complete or missed
            </p>
          </div>
          <button id="open-generate-modal" onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2">
            <Sparkles size={16} /> Generate Plan
          </button>
        </div>

        {/* Week navigator */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevWeek} className="btn-ghost flex items-center gap-1">
            <ChevronLeft size={18} /> Previous
          </button>
          <span className="text-text-secondary text-sm font-medium">
            {format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
          </span>
          <button onClick={nextWeek} className="btn-ghost flex items-center gap-1">
            Next <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-6 gap-4 snap-x">
            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const daySessions = sessions[key] ?? [];
              const isToday = key === startOfToday().toISOString().split('T')[0];

              return (
                <div key={key} className={`card min-w-[280px] flex-shrink-0 flex flex-col snap-start
                  ${isToday ? 'border-primary/40 shadow-glow-sm' : ''}`}>
                  {/* Day header */}
                  <div className={`text-center mb-4 pb-3 border-b border-bg-border`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider
                      ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={`text-xl font-bold mt-1
                      ${isToday ? 'text-primary' : 'text-text-primary'}`}>
                      {format(day, 'd')}
                    </p>
                    {daySessions.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1.5" />
                    )}
                  </div>

                  {/* Sessions */}
                  <div className="flex-1 space-y-3">
                    {daySessions.map(s => (
                      <SessionCard key={s.id} session={s} onUpdate={fetchSessions} />
                    ))}
                    {daySessions.length === 0 && (
                      <p className="text-xs text-text-muted text-center mt-6 opacity-60">No sessions</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <GenerateModal
            onClose={() => setShowModal(false)}
            onGenerated={() => { setShowModal(false); fetchSessions(); }}
          />
        )}
      </div>
    </Layout>
  );
}
