/**
 * Student Management Page
 * Tabs: Students List (CRUD) | Student Submissions (teacher monitoring)
 */
import { useState, useEffect, useCallback } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent, getAllSubmissions } from '../services/api';
import toast from 'react-hot-toast';

const GRADE_COLORS = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', Fail: '#ef4444' };

function GradeBadge({ marks, grade }) {
  if (grade) {
    const color = GRADE_COLORS[grade] || '#64748b';
    return <span className="badge" style={{ background: `${color}22`, color }}>{grade}</span>;
  }
  if (marks == null) return <span className="badge" style={{ background: 'rgba(100,116,139,0.15)', color: '#64748b' }}>N/A</span>;
  if (marks >= 85) return <span className="badge badge-a">A</span>;
  if (marks >= 70) return <span className="badge badge-b">B</span>;
  if (marks >= 50) return <span className="badge badge-c">C</span>;
  return <span className="badge badge-fail">Fail</span>;
}

function getEmptyForm() {
  return {
    studentId: '', name: '', email: '', attendance: '', studyHours: '',
    internalMarks: '', prevMarks: '', assignmentScore: '', sleepHours: '',
    participation: '0', testAvg: '', backlogs: '0'
  };
}

export default function StudentsPage() {
  const [activeTab, setActiveTab]     = useState('students');
  // Students tab state
  const [students, setStudents]       = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, limit: 15, total: 0, pages: 0 });
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState({ open: false, mode: 'create', data: null });
  const [form, setForm]               = useState(getEmptyForm());
  // Submissions tab state
  const [submissions, setSubmissions] = useState([]);
  const [subPagination, setSubPag]    = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [subSearch, setSubSearch]     = useState('');
  const [subLoading, setSubLoading]   = useState(false);

  // ── Students fetching ──────────────────────────────────────────────────────
  const fetchStudents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getStudents({ page, limit: 15, search });
      setStudents(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchStudents(1); }, [fetchStudents]);

  // ── Submissions fetching ───────────────────────────────────────────────────
  const fetchSubmissions = useCallback(async (page = 1) => {
    setSubLoading(true);
    try {
      const { data } = await getAllSubmissions({ page, limit: 20, search: subSearch });
      setSubmissions(data.data);
      setSubPag(data.pagination);
    } catch { toast.error('Failed to load submissions'); }
    finally { setSubLoading(false); }
  }, [subSearch]);

  useEffect(() => {
    if (activeTab === 'submissions') fetchSubmissions(1);
  }, [activeTab, fetchSubmissions]);

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const openCreate = () => { setForm(getEmptyForm()); setModal({ open: true, mode: 'create', data: null }); };
  const openEdit   = (s) => {
    setForm({
      studentId: s.studentId, name: s.name, email: s.email || '',
      attendance: s.attendance?.toString() || '', studyHours: s.studyHours?.toString() || '',
      internalMarks: s.internalMarks?.toString() || '', prevMarks: s.prevMarks?.toString() || '',
      assignmentScore: s.assignmentScore?.toString() || '', sleepHours: s.sleepHours?.toString() || '',
      participation: s.participation?.toString() || '0', testAvg: s.testAvg?.toString() || '',
      backlogs: s.backlogs?.toString() || '0'
    });
    setModal({ open: true, mode: 'edit', data: s });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.name) return toast.error('Student ID and Name are required');
    try {
      const payload = {
        ...form,
        attendance:      parseFloat(form.attendance)      || 0,
        studyHours:      parseFloat(form.studyHours)      || 0,
        internalMarks:   parseFloat(form.internalMarks)   || 0,
        prevMarks:       parseFloat(form.prevMarks)       || 0,
        assignmentScore: parseFloat(form.assignmentScore) || 0,
        sleepHours:      parseFloat(form.sleepHours)      || 0,
        participation:   parseInt(form.participation)     || 0,
        testAvg:         parseFloat(form.testAvg)         || 0,
        backlogs:        parseInt(form.backlogs)          || 0,
      };
      if (modal.mode === 'create') { await createStudent(payload); toast.success('Student created!'); }
      else                         { await updateStudent(modal.data._id, payload); toast.success('Student updated!'); }
      setModal({ open: false, mode: 'create', data: null });
      fetchStudents(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try { await deleteStudent(id); toast.success('Student deleted'); fetchStudents(pagination.page); }
    catch { toast.error('Delete failed'); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>👥 Student Management</h1>
          <p>Manage student records, monitor student-submitted data</p>
        </div>
        {activeTab === 'students' && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add Student</button>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'students',    label: '👥 Students',    icon: '' },
          { key: 'submissions', label: '📤 Submissions', icon: '' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
              background: activeTab === tab.key ? 'linear-gradient(135deg,#8b5cf6,#6d28d9)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ STUDENTS TAB ══ */}
      {activeTab === 'students' && (
        <>
          <div className="filters-bar">
            <input
              type="text" className="form-input search-input"
              placeholder="🔍 Search by name, email, or ID..."
              value={search} onChange={e => setSearch(e.target.value)}
              id="student-search"
            />
          </div>

          <div className="card">
            {loading ? (
              <div className="loading-container"><div className="spinner" /></div>
            ) : (
              <>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Name</th><th>Attendance</th><th>Study Hrs</th>
                        <th>Internal</th><th>Assignment</th><th>Test Avg</th>
                        <th>Backlogs</th><th>Final</th><th>Grade</th>
                        <th>Source</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s._id}>
                          <td style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{s.studentId}</td>
                          <td>{s.name}</td>
                          <td>
                            <span style={{ color: s.attendance < 60 ? '#ef4444' : s.attendance < 75 ? '#f59e0b' : '#10b981' }}>
                              {s.attendance?.toFixed(1)}%
                            </span>
                          </td>
                          <td>{s.studyHours?.toFixed(1)}h</td>
                          <td>{s.internalMarks?.toFixed(1)}</td>
                          <td>{s.assignmentScore?.toFixed(1)}</td>
                          <td>{s.testAvg?.toFixed(1)}</td>
                          <td>
                            <span style={{ color: s.backlogs > 0 ? '#ef4444' : '#10b981' }}>{s.backlogs}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{s.finalMarks?.toFixed(1) || '—'}</td>
                          <td><GradeBadge marks={s.finalMarks} /></td>
                          <td>
                            {s.userId
                              ? <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', fontSize: '11px' }}>Self</span>
                              : <span className="badge" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', fontSize: '11px' }}>CSV</span>
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>✏️</button>
                              <button className="btn btn-sm btn-danger"    onClick={() => handleDelete(s._id)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr><td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          No students found. Add students or upload a CSV dataset.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button disabled={pagination.page <= 1} onClick={() => fetchStudents(pagination.page - 1)}>← Prev</button>
                    {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
                      <button key={p} className={pagination.page === p ? 'active' : ''} onClick={() => fetchStudents(p)}>{p}</button>
                    ))}
                    <button disabled={pagination.page >= pagination.pages} onClick={() => fetchStudents(pagination.page + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ══ SUBMISSIONS TAB ══ */}
      {activeTab === 'submissions' && (
        <>
          <div className="filters-bar">
            <input
              type="text" className="form-input search-input"
              placeholder="🔍 Search by student name or email..."
              value={subSearch} onChange={e => setSubSearch(e.target.value)}
            />
          </div>

          <div className="card">
            {subLoading ? (
              <div className="loading-container"><div className="spinner" /></div>
            ) : (
              <>
                <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  📤 {subPagination.total} total student submissions
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th><th>Email</th><th>Predicted</th><th>Grade</th>
                        <th>Attendance</th><th>Study Hrs</th><th>Internal</th>
                        <th>Test Avg</th><th>Backlogs</th><th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => (
                        <tr key={sub._id}>
                          <td style={{ fontWeight: 600 }}>{sub.studentName}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{sub.studentEmail || '—'}</td>
                          <td style={{
                            fontWeight: 700,
                            color: sub.predictedMarks >= 70 ? '#10b981' : sub.predictedMarks >= 50 ? '#f59e0b' : '#ef4444'
                          }}>
                            {sub.predictedMarks ? sub.predictedMarks.toFixed(1) : '—'}
                          </td>
                          <td><GradeBadge grade={sub.grade} /></td>
                          <td>
                            <span style={{ color: sub.features?.attendance < 75 ? '#f59e0b' : '#10b981' }}>
                              {sub.features?.attendance?.toFixed(1)}%
                            </span>
                          </td>
                          <td>{sub.features?.studyHours?.toFixed(1)}h</td>
                          <td>{sub.features?.internalMarks?.toFixed(1)}</td>
                          <td>{sub.features?.testAvg?.toFixed(1)}</td>
                          <td>
                            <span style={{ color: sub.features?.backlogs > 0 ? '#ef4444' : '#10b981' }}>
                              {sub.features?.backlogs}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                            {new Date(sub.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                      {submissions.length === 0 && (
                        <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          No student submissions yet. Students can submit their data from their portal.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {subPagination.pages > 1 && (
                  <div className="pagination">
                    <button disabled={subPagination.page <= 1} onClick={() => fetchSubmissions(subPagination.page - 1)}>← Prev</button>
                    {Array.from({ length: Math.min(subPagination.pages, 7) }, (_, i) => i + 1).map(p => (
                      <button key={p} className={subPagination.page === p ? 'active' : ''} onClick={() => fetchSubmissions(p)}>{p}</button>
                    ))}
                    <button disabled={subPagination.page >= subPagination.pages} onClick={() => fetchSubmissions(subPagination.page + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ── Create/Edit Modal ── */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{modal.mode === 'create' ? '➕ Add Student' : '✏️ Edit Student'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Student ID</label>
                  <input name="studentId" className="form-input" value={form.studentId} onChange={handleChange} placeholder="STU001" disabled={modal.mode === 'edit'} />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" className="form-input" value={form.name} onChange={handleChange} placeholder="John Doe" />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="email" className="form-input" value={form.email} onChange={handleChange} placeholder="student@example.com" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Attendance (%)</label>
                  <input name="attendance" type="number" step="0.01" className="form-input" value={form.attendance} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Study Hours</label>
                  <input name="studyHours" type="number" step="0.01" className="form-input" value={form.studyHours} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Internal Marks</label>
                  <input name="internalMarks" type="number" step="0.01" className="form-input" value={form.internalMarks} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Previous Marks</label>
                  <input name="prevMarks" type="number" step="0.01" className="form-input" value={form.prevMarks} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assignment Score</label>
                  <input name="assignmentScore" type="number" step="0.01" className="form-input" value={form.assignmentScore} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Test Average</label>
                  <input name="testAvg" type="number" step="0.01" className="form-input" value={form.testAvg} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Sleep Hours</label>
                  <input name="sleepHours" type="number" step="0.01" className="form-input" value={form.sleepHours} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Participation</label>
                  <select name="participation" className="form-input" value={form.participation} onChange={handleChange}>
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Backlogs</label>
                <input name="backlogs" type="number" className="form-input" value={form.backlogs} onChange={handleChange} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>Cancel</button>
                <button type="submit" className="btn btn-primary">{modal.mode === 'create' ? 'Create Student' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
