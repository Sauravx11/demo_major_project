/**
 * StudentDashboardPage – Personal performance dashboard for students
 * Route: /my-dashboard (student only)
 * Shows: latest grade, trend chart, radar chart, submission history, recommendations
 */
import { useState, useEffect } from 'react';
import { getStudentOverview, getMySubmissions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const GRADE_CONFIG = {
  A:    { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Excellent', emoji: '🌟' },
  B:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Good',      emoji: '👍' },
  C:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Average',   emoji: '📈' },
  Fail: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'At Risk',   emoji: '🚨' },
  'N/A':{ color: '#64748b', bg: 'rgba(100,116,139,0.15)', label: 'No data', emoji: '❓' },
};

const tooltipStyle = {
  contentStyle: { background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }
};

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
      <div className="stat-info">
        <h3 style={{ color }}>{value}</h3>
        <p>{label}</p>
        {sub && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</span>}
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [ovRes, subRes] = await Promise.all([
        getStudentOverview(),
        getMySubmissions({ page: 1, limit: 10 })
      ]);
      setOverview(ovRes.data.data);
      setSubmissions(subRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load your dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner" />
    </div>
  );

  if (!overview) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1>📊 My Dashboard</h1>
            <p>Welcome, {user?.name}! Your personal performance hub.</p>
          </div>
          <a href="/submit" className="btn btn-primary">🎯 Submit My Data</a>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>📝</div>
          <h2 style={{ marginBottom: '8px' }}>No data yet!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Submit your academic data to get your first performance prediction.
          </p>
          <a href="/submit" className="btn btn-primary" style={{ display: 'inline-block', padding: '12px 32px' }}>
            🚀 Get Started
          </a>
        </div>
      </div>
    );
  }

  const { student, latestPrediction, submissionCount, radarData, trendData } = overview;
  const grade = latestPrediction?.grade || 'N/A';
  const gc = GRADE_CONFIG[grade] || GRADE_CONFIG['N/A'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>📊 My Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong>! Here's your academic performance overview.</p>
        </div>
        <a href="/submit" className="btn btn-primary">🔄 Update My Data</a>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard
          icon={gc.emoji} label="Current Grade" value={grade}
          sub={gc.label} color={gc.color}
        />
        <StatCard
          icon="🎯" label="Predicted Score"
          value={latestPrediction ? `${latestPrediction.predictedMarks?.toFixed(1)}/100` : 'N/A'}
          color="#8b5cf6"
        />
        <StatCard
          icon="📋" label="Attendance"
          value={`${student.attendance?.toFixed(1)}%`}
          sub={student.attendance < 75 ? '⚠️ Below 75%' : '✅ On track'}
          color={student.attendance < 60 ? '#ef4444' : student.attendance < 75 ? '#f59e0b' : '#10b981'}
        />
        <StatCard
          icon="📤" label="Total Submissions"
          value={submissionCount}
          sub="Records submitted"
          color="#06b6d4"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        {/* Trend Line Chart */}
        <div className="chart-card">
          <h3>📈 Score Trend Over Time</h3>
          {trendData.length > 1 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone" dataKey="predictedMarks" stroke="#8b5cf6"
                  strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }}
                  name="Predicted Marks"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
              <p>Submit more than once to see your trend</p>
            </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="chart-card">
          <h3>🕸️ Academic Profile Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar
                name="Profile" dataKey="value"
                stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3}
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
              <Tooltip {...tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Academic Stats Bar ── */}
      <div className="chart-card" style={{ marginBottom: '24px' }}>
        <h3>📋 Current Academic Metrics</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { name: 'Attendance',  value: student.attendance   || 0 },
            { name: 'Internal',   value: student.internalMarks || 0 },
            { name: 'Prev Marks', value: student.prevMarks     || 0 },
            { name: 'Assignment', value: student.assignmentScore || 0 },
            { name: 'Test Avg',   value: student.testAvg       || 0 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
            <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {[0, 1, 2, 3, 4].map(i => (
                <Cell key={i} fill={['#8b5cf6', '#06b6d4', '#3b82f6', '#10b981', '#f59e0b'][i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Two Column: Recommendations + History ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recommendations */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginBottom: '16px' }}>💡 Improvement Tips</h3>
          {latestPrediction?.recommendations?.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {latestPrediction.recommendations.map((rec, i) => (
                <li key={i} style={{
                  padding: '10px 14px', marginBottom: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px', borderLeft: '3px solid var(--accent-purple)',
                  fontSize: '13px', lineHeight: 1.5
                }}>{rec}</li>
              ))}
            </ul>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <p>No issues detected. Keep it up!</p>
            </div>
          )}

          {/* Career Suggestion */}
          {latestPrediction?.careerSuggestion && (
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
                {latestPrediction.careerSuggestion}
              </div>
            </div>
          )}
        </div>

        {/* Submission History */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ marginBottom: '16px' }}>📜 Submission History</h3>
          {submissions.length > 0 ? (
            <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
              {submissions.map((s, i) => {
                const sc = GRADE_CONFIG[s.grade] || GRADE_CONFIG['N/A'];
                return (
                  <div key={s._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < submissions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>
                        {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Attendance: {s.features?.attendance?.toFixed(1)}% · Study: {s.features?.studyHours?.toFixed(1)}h
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '16px', color: sc.color }}>
                        {s.predictedMarks ? s.predictedMarks.toFixed(1) : '—'}
                      </span>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: '12px',
                        background: sc.bg, color: sc.color, fontWeight: 600
                      }}>{s.grade}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
              <p>No submissions yet</p>
            </div>
          )}
          {submissions.length > 0 && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <a href="/predictions" style={{ fontSize: '13px', color: 'var(--accent-purple)', textDecoration: 'none' }}>
                View all predictions →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
