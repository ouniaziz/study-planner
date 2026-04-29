import { useEffect, useState } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../api/subjectsApi';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, BookOpen, Star, CalendarDays,
  Loader2, X, Save, AlertTriangle
} from 'lucide-react';

const EMPTY_FORM = { name: '', difficulty: 3, importance: 3, examDate: '' };

function StarRating({ value, onChange, disabled }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" disabled={disabled}
          onClick={() => onChange?.(n)}
          className={`transition-all duration-150 hover:scale-110 ${n <= value ? 'star-filled' : 'star-empty'}`}>
          <Star size={18} fill={n <= value ? '#F59E0B' : 'none'} />
        </button>
      ))}
    </div>
  );
}

function urgencyBadge(days) {
  if (days <= 7)  return <span className="badge-urgent">🔴 Urgent ({days}d)</span>;
  if (days <= 30) return <span className="badge-warning">🟡 Soon ({days}d)</span>;
  return <span className="badge-safe">🟢 {days}d left</span>;
}

function SubjectModal({ subject, onClose, onSaved }) {
  const [form, setForm]     = useState(subject ?? EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const isEdit = !!subject;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())  return toast.error('Name is required');
    if (!form.examDate)     return toast.error('Exam date is required');
    if (new Date(form.examDate) <= new Date()) return toast.error('Exam date must be in the future');

    setLoading(true);
    try {
      if (isEdit) await updateSubject(subject.id, form);
      else        await createSubject(form);
      toast.success(isEdit ? 'Subject updated!' : 'Subject added!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">
            {isEdit ? 'Edit Subject' : 'Add New Subject'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Subject Name</label>
            <input id="subject-name" className="input" placeholder="e.g. Mathematics"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div>
            <label className="label">Difficulty (1 = easy, 5 = very hard)</label>
            <StarRating value={form.difficulty} onChange={v => set('difficulty', v)} />
          </div>

          <div>
            <label className="label">Importance (1 = low, 5 = critical)</label>
            <StarRating value={form.importance} onChange={v => set('importance', v)} />
          </div>

          <div>
            <label className="label">Exam Date</label>
            <input id="subject-exam-date" type="date" className="input"
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              value={form.examDate} onChange={e => set('examDate', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button id="subject-save" type="submit" disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEdit ? 'Update' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ subject, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteSubject(subject.id);
      toast.success('Subject deleted');
      onDeleted();
    } catch {
      toast.error('Failed to delete subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-sm">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={26} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Delete Subject?</h2>
            <p className="text-text-secondary mt-1 text-sm">
              <strong className="text-text-primary">{subject.name}</strong> and all its study sessions will be permanently removed.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button id="subject-confirm-delete" onClick={handleDelete} disabled={loading}
              className="btn-danger flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  const [subjects, setSubjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // null | 'create' | subject (edit) | { delete: subject }

  const fetchSubjects = () => {
    setLoading(true);
    getSubjects()
      .then(r => setSubjects(r.data))
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchSubjects, []);

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Subjects</h1>
            <p className="page-subtitle">Manage your subjects and track exam deadlines</p>
          </div>
          <button id="add-subject-btn" onClick={() => setModal('create')}
            className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Subject
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="card flex flex-col items-center text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No subjects yet</h3>
            <p className="text-text-muted mb-6">Add your first subject to start building your study plan.</p>
            <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Your First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <div key={subject.id} className="card-hover group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <BookOpen size={16} className="text-white" />
                    </div>
                    <h3 className="font-semibold text-text-primary leading-tight">{subject.name}</h3>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button id={`edit-${subject.id}`} onClick={() => setModal(subject)}
                      className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-all">
                      <Pencil size={14} />
                    </button>
                    <button id={`delete-${subject.id}`} onClick={() => setModal({ delete: subject })}
                      className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Ratings */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Difficulty</span>
                    <StarRating value={subject.difficulty} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Importance</span>
                    <StarRating value={subject.importance} disabled />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-bg-border">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <CalendarDays size={13} />
                    {new Date(subject.examDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                  {urgencyBadge(subject.daysUntilExam)}
                </div>

                {/* Priority score bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Priority Score</span>
                    <span className="text-primary font-semibold">{subject.priorityScore?.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, (subject.priorityScore / 5.2) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {modal === 'create' && (
          <SubjectModal onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchSubjects(); }} />
        )}
        {modal && typeof modal === 'object' && !modal.delete && (
          <SubjectModal subject={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchSubjects(); }} />
        )}
        {modal?.delete && (
          <DeleteConfirm subject={modal.delete} onClose={() => setModal(null)} onDeleted={() => { setModal(null); fetchSubjects(); }} />
        )}
      </div>
    </Layout>
  );
}
