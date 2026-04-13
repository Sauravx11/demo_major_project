/**
 * StudentInputPage – Student self-service academic data entry + instant prediction
 * Route: /submit (student only)
 */
import { useState } from 'react';
import { submitStudentData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FIELDS = [
  {
    key: 'attendance', label: 'Attendance', unit: '%', min: 0, max: 100, step: 0.5,
    icon: '📋', hint: 'Your current attendance percentage',
    warn: (v) => v < 60 ? 'danger' : v < 75 ? 'warning' : 'good'
  },
  {
    key: 'studyHours', label: 'Daily Study Hours', unit: 'hrs', min: 0, max: 12, step: 0.5,
    icon: '📚', hint: 'Average hours you study per day',
    warn: (v) => v < 2 ? 'danger' : v < 4 ? 'warning' : 'good'
  },
  {
    key: 'internalMarks', label: 'Internal Marks', unit: '/100', min: 0, max: 100, step: 0.5,
    icon: '📝', hint: 'Your internal assessment score',
    warn: (v) => v < 40 ? 'danger' : v < 60 ? 'warning' : 'good'
  },
  {
    key: 'prevMarks', label: 'Previous Semester Marks', unit: '/100', min: 0, max: 100, step: 0.5,
    icon: '📊', hint: 'Your marks in the previous semester',
    warn: (v) => v < 40 ? 'danger' : v < 60 ? 'warning' : 'good'
  },
  {
    key: 'assignmentScore', label: 'Assignment Score', unit: '/100', min: 0, max: 100, step: 0.5,
    icon: '📄', hint: 'Your average assignment completion score',
    warn: (v) => v < 40 ? 'danger' : v < 60 ? 'warning' : 'good'
  },
  {
    key: 'testAvg', label: 'Test Average', unit: '/100', min: 0, max: 100, step: 0.5,
    icon: '✏️', hint: 'Average score across all unit tests',
    warn: (v) => v < 40 ? 'danger' : v < 60 ? 'warning' : 'good'
  },
  {
    key: 'backlogs', label: 'Number of Backlogs', unit: '', min: 0, max: 10, step: 1,
    icon: '🔄', hint: 'Subjects you need to clear from previous semesters',
    warn: (v) => v > 2 ? 'danger' : v > 0 ? 'warning' : 'good'
  },
];

/** Subject fields per stream+scienceType combination */
const SUBJECT_MAP = {
  'Science_Maths': [
    { key: 'physics', label: 'Physics', icon: '⚛️' },
    { key: 'chemistry', label: 'Chemistry', icon: '🧪' },
    { key: 'maths', label: 'Maths', icon: '📐' },
  ],
  'Science_Bio': [
    { key: 'physics', label: 'Physics', icon: '⚛️' },
    { key: 'chemistry', label: 'Chemistry', icon: '🧪' },
    { key: 'biology', label: 'Biology', icon: '🧬' },
  ],
  'Commerce': [
    { key: 'accounts', label: 'Accounts', icon: '🧾' },
    { key: 'businessStudies', label: 'Business Studies', icon: '💼' },
    { key: 'economics', label: 'Economics', icon: '📈' },
  ],
  'Arts': [
    { key: 'history', label: 'History', icon: '🏛️' },
    { key: 'politicalScience', label: 'Political Science', icon: '🏛️' },
    { key: 'geography', label: 'Geography', icon: '🌍' },
  ],
};

function getSubjectKey(stream, scienceType) {
  if (stream === 'Science') return `Science_${scienceType || 'Maths'}`;
  return stream;
}

const GRADE_CONFIG = {
  A:    { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Excellent!', emoji: '🌟' },
  B:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Good',       emoji: '👍' },
  C:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Average',    emoji: '📈' },
  Fail: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  label: 'At Risk',    emoji: '🚨' },
};

const WARN_COLORS = {
  good:    '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
};

function getInitialForm() {
  return {
    attendance: 75, studyHours: 4, internalMarks: 65, prevMarks: 65,
    assignmentScore: 70, stream: 'Science', scienceType: 'Maths',
    physics: 65, chemistry: 65, maths: 65, biology: 0,
    accounts: 0, businessStudies: 0, economics: 0,
    history: 0, politicalScience: 0, geography: 0,
    participation: 1, testAvg: 65, backlogs: 0
  };
}

export default function StudentInputPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(getInitialForm());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const handleStreamChange = (newStream) => {
    const updates = { stream: newStream };
    // Reset all subject marks when stream changes
    updates.physics = 0; updates.chemistry = 0; updates.maths = 0; updates.biology = 0;
    updates.accounts = 0; updates.businessStudies = 0; updates.economics = 0;
    updates.history = 0; updates.politicalScience = 0; updates.geography = 0;

    if (newStream === 'Science') {
      updates.scienceType = 'Maths';
      updates.physics = 65; updates.chemistry = 65; updates.maths = 65;
    } else if (newStream === 'Commerce') {
      updates.scienceType = '';
      updates.accounts = 65; updates.businessStudies = 65; updates.economics = 65;
    } else {
      updates.scienceType = '';
      updates.history = 65; updates.politicalScience = 65; updates.geography = 65;
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleScienceTypeChange = (newType) => {
    const updates = { scienceType: newType, maths: 0, biology: 0 };
    if (newType === 'Maths') updates.maths = 65;
    else updates.biology = 65;
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await submitStudentData(form);
      setResult(data);
      toast.success('🎯 Prediction generated successfully!');
      window.scrollTo({ top: document.getElementById('result-section')?.offsetTop - 80, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Is the ML service running?');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(getInitialForm());
    setResult(null);
  };

  const gradeConfig = result?.prediction ? GRADE_CONFIG[result.prediction.grade] || GRADE_CONFIG['C'] : null;
  const currentSubjects = SUBJECT_MAP[getSubjectKey(form.stream, form.scienceType)] || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🎯 Submit Academic Data</h1>
          <p>Fill in your current academic details to get an instant AI-powered performance prediction</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
        {/* ── Input Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎓</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px' }}>{user?.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Student • Academic Data Entry</div>
                </div>
              </div>
            </div>

            {/* Participation toggle */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>🙋 Class Participation</span>
                <div
                  id="participation-toggle"
                  onClick={() => setForm(p => ({ ...p, participation: p.participation ? 0 : 1 }))}
                  style={{
                    width: 56, height: 28, borderRadius: 14, cursor: 'pointer', transition: 'all 0.3s',
                    background: form.participation ? '#10b981' : 'rgba(255,255,255,0.1)',
                    position: 'relative', display: 'flex', alignItems: 'center',
                    padding: '0 4px'
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transition: 'transform 0.3s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transform: form.participation ? 'translateX(28px)' : 'translateX(0)'
                  }} />
                </div>
              </label>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {form.participation ? '✅ Participates in class activities' : '❌ Does not actively participate'}
              </div>
            </div>

            {/* Stream dropdown */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📘 Stream</span>
                <span style={{
                  fontWeight: 700, fontSize: '13px', color: '#8b5cf6',
                  background: 'rgba(139,92,246,0.12)', padding: '2px 10px', borderRadius: 20
                }}>
                  {form.stream}
                </span>
              </label>
              <select
                id="select-stream"
                className="form-input"
                value={form.stream}
                onChange={e => handleStreamChange(e.target.value)}
                style={{ marginTop: '8px' }}
              >
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
              </select>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Select your academic stream
              </div>
            </div>

            {/* Science Type dropdown (only for Science) */}
            {form.stream === 'Science' && (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🔬 Science Type</span>
                  <span style={{
                    fontWeight: 700, fontSize: '13px', color: '#06b6d4',
                    background: 'rgba(6,182,212,0.12)', padding: '2px 10px', borderRadius: 20
                  }}>
                    {form.scienceType}
                  </span>
                </label>
                <select
                  id="select-scienceType"
                  className="form-input"
                  value={form.scienceType}
                  onChange={e => handleScienceTypeChange(e.target.value)}
                  style={{ marginTop: '8px' }}
                >
                  <option value="Maths">Maths</option>
                  <option value="Bio">Bio</option>
                </select>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Select Maths or Bio track within Science
                </div>
              </div>
            )}

            {/* Dynamic Subject Marks */}
            {currentSubjects.length > 0 && (
              <div style={{
                marginBottom: '20px', padding: '16px',
                background: 'rgba(139,92,246,0.05)',
                border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: '#8b5cf6' }}>
                  📚 Subject Marks
                </div>
                {currentSubjects.map(subj => {
                  const val = form[subj.key] || 0;
                  const warnColor = val < 40 ? '#ef4444' : val < 60 ? '#f59e0b' : '#10b981';
                  const pct = (val / 100) * 100;
                  return (
                    <div key={subj.key} className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{subj.icon} {subj.label}</span>
                        <span style={{
                          fontWeight: 700, fontSize: '15px', color: warnColor,
                          background: `${warnColor}18`, padding: '2px 10px', borderRadius: 20
                        }}>
                          {val.toFixed(1)}/100
                        </span>
                      </label>
                      <input
                        id={`slider-${subj.key}`}
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        value={val}
                        onChange={e => handleChange(subj.key, e.target.value)}
                        style={{
                          width: '100%', margin: '8px 0 4px',
                          accentColor: warnColor,
                          background: `linear-gradient(to right, ${warnColor} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
                          height: 6, borderRadius: 3, outline: 'none', border: 'none', cursor: 'pointer'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>0</span>
                        <span>Marks in {subj.label}</span>
                        <span>100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Slider inputs */}
            {FIELDS.map(field => {
              const warnLevel = field.warn(form[field.key]);
              const warnColor = WARN_COLORS[warnLevel];
              const pct = ((form[field.key] - field.min) / (field.max - field.min)) * 100;
              return (
                <div key={field.key} className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{field.icon} {field.label}</span>
                    <span style={{
                      fontWeight: 700, fontSize: '15px', color: warnColor,
                      background: `${warnColor}18`, padding: '2px 10px', borderRadius: 20
                    }}>
                      {field.key === 'backlogs' ? form[field.key] : form[field.key].toFixed(1)}{field.unit}
                    </span>
                  </label>
                  <input
                    id={`slider-${field.key}`}
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={form[field.key]}
                    onChange={e => handleChange(field.key, e.target.value)}
                    style={{
                      width: '100%', margin: '8px 0 4px',
                      accentColor: warnColor,
                      background: `linear-gradient(to right, ${warnColor} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
                      height: 6, borderRadius: 3, outline: 'none', border: 'none', cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{field.min}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{field.hint}</span>
                    <span>{field.max}</span>
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                id="submit-data-btn"
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1, padding: '14px', fontSize: '15px', fontWeight: 700 }}
              >
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Analyzing with AI...
                  </span>
                ) : '🔮 Get My Prediction'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleReset}>↺ Reset</button>
            </div>
          </div>
        </form>

        {/* ── Result Panel ── */}
        {result && (
          <div id="result-section" className="fade-in">
            {result.prediction ? (
              <>
                {/* Grade Card */}
                <div className="card" style={{
                  border: `2px solid ${gradeConfig.color}`,
                  boxShadow: `0 0 40px ${gradeConfig.bg}`,
                  marginBottom: '16px', textAlign: 'center', padding: '32px 24px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>{gradeConfig.emoji}</div>
                  <div style={{
                    fontSize: '72px', fontWeight: 900, color: gradeConfig.color,
                    lineHeight: 1, marginBottom: '4px'
                  }}>
                    {result.prediction.predictedMarks?.toFixed(1)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>Predicted Final Marks / 100</div>

                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: gradeConfig.bg, border: `1px solid ${gradeConfig.color}40`,
                    borderRadius: '12px', padding: '8px 20px',
                    color: gradeConfig.color, fontWeight: 700, fontSize: '20px'
                  }}>
                    Grade: {result.prediction.grade} — {gradeConfig.label}
                  </div>

                  <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Powered by {result.prediction.modelUsed}
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {[
                    { label: 'Attendance', value: `${form.attendance.toFixed(1)}%`, icon: '📋', warn: form.attendance < 75 },
                    { label: 'Study Hours', value: `${form.studyHours.toFixed(1)}h/day`, icon: '📚', warn: form.studyHours < 3 },
                    { label: 'Internal Marks', value: form.internalMarks.toFixed(1), icon: '📝', warn: form.internalMarks < 50 },
                    { label: 'Backlogs', value: form.backlogs, icon: '🔄', warn: form.backlogs > 0 },
                  ].map(stat => (
                    <div key={stat.label} className="card" style={{ padding: '12px 16px', marginBottom: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>{stat.icon} {stat.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '18px', color: stat.warn ? '#f59e0b' : '#10b981' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {result.prediction.recommendations?.length > 0 && (
                  <div className="card" style={{ marginBottom: 0 }}>
                    <h3 style={{ marginBottom: '14px', fontSize: '15px' }}>💡 Personalized Recommendations</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {result.prediction.recommendations.map((rec, i) => (
                        <li key={i} style={{
                          padding: '10px 14px', marginBottom: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: '10px', borderLeft: '3px solid var(--accent-purple)',
                          fontSize: '13px', lineHeight: '1.5'
                        }}>
                          {rec}
                        </li>
                      ))}
                    </ul>

                    {/* Career Suggestion */}
                    {result.prediction.careerSuggestion && (
                      <div style={{
                        marginTop: '16px', padding: '14px 18px',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.08))',
                        border: '1px solid rgba(139,92,246,0.25)',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px', color: '#8b5cf6' }}>
                          🎯 Career Suggestion
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                          {result.prediction.careerSuggestion}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '14px', textAlign: 'center' }}>
                      <a href="/my-dashboard" style={{ fontSize: '13px', color: 'var(--accent-purple)', textDecoration: 'none' }}>
                        📊 View your full performance dashboard →
                      </a>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                <h3>Data saved, prediction unavailable</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                  The ML service may not be running. Your data has been saved — ask your teacher to run predictions.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
