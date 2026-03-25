/**
 * Dashboard Page
 * Teacher: full class analytics + student submission monitor
 * Student: redirected to /my-dashboard (but kept for safety)
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getOverview, getAttendanceVsMarks, getStudyHoursVsPerformance,
  getPerformanceDistribution, getTopWeakStudents
} from '../services/api';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS      = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const GRADE_COLORS = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', Fail: '#ef4444' };
const TOOLTIP_STYLE = {
  contentStyle: { background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }
};

function GradeBadge({ grade }) {
  const cls = { A: 'badge-a', B: 'badge-b', C: 'badge-c', Fail: 'badge-fail' };
  return <span className={`badge ${cls[grade] || ''}`}>{grade}</span>;
}

export default function DashboardPage() {
  const { user, isTeacher } = useAuth();
  const [overview, setOverview]         = useState(null);
  const [attendanceData, setAttendance] = useState([]);
  const [studyData, setStudy]           = useState([]);
  const [distData, setDist]             = useState([]);
  const [topWeak, setTopWeak]           = useState({ topStudents: [], weakStudents: [] });
  const [loading, setLoading]           = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    // ── Primary data (required for dashboard to render) ──────────────────
    try {
      const [ov, att, study, dist] = await Promise.all([
        getOverview(),
        getAttendanceVsMarks(),
        getStudyHoursVsPerformance(),
        getPerformanceDistribution(),
      ]);
      setOverview(ov.data.data);
      setAttendance(att.data.data);
      setStudy(study.data.data);
      setDist(dist.data.data);
    } catch (err) {
      console.error('[Dashboard] Primary data error:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }

    // ── Secondary data (optional — leaderboard panels) ───────────────────
    try {
      const tw = await getTopWeakStudents();
      setTopWeak(tw.data.data);
    } catch (err) {
      console.warn('[Dashboard] Top/weak students unavailable:', err?.response?.data?.message || err.message);
      // Leave topWeak as default { topStudents: [], weakStudents: [] } — panels just stay empty
    }
  };


  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  const gradeData = overview?.gradeDistribution
    ? Object.entries(overview.gradeDistribution).map(([grade, count]) => ({ name: grade, value: count }))
    : [];

  const avg = overview?.averages || {};

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>📊 Teacher Dashboard</h1>
          <p>Welcome, <strong>{user?.name}</strong>! Full class performance overview & student monitoring.</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon purple">👥</div>
          <div className="stat-info">
            <h3>{overview?.totalStudents || 0}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🤖</div>
          <div className="stat-info">
            <h3>{overview?.totalPredictions || 0}</h3>
            <p>ML Predictions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📤</div>
          <div className="stat-info">
            <h3>{overview?.totalSubmissions || 0}</h3>
            <p>Student Submissions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⚠️</div>
          <div className="stat-info">
            <h3>{overview?.atRiskCount || 0}</h3>
            <p>At-Risk Students</p>
          </div>
        </div>
      </div>

      {/* ── Average Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Avg Attendance',   value: avg.avgAttendance   ? avg.avgAttendance.toFixed(1)   + '%' : 'N/A', color: '#8b5cf6' },
          { label: 'Avg Study Hours',  value: avg.avgStudyHours   ? avg.avgStudyHours.toFixed(1)   + 'h' : 'N/A', color: '#06b6d4' },
          { label: 'Avg Internal',     value: avg.avgInternalMarks ? avg.avgInternalMarks.toFixed(1) : 'N/A',       color: '#3b82f6' },
          { label: 'Avg Backlogs',     value: avg.avgBacklogs     ? avg.avgBacklogs.toFixed(1)               : 'N/A', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px', marginBottom: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Grid ── */}
      <div className="charts-grid">
        {/* Attendance vs Marks Scatter */}
        <div className="chart-card">
          <h3>📍 Attendance vs Final Marks</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="attendance" name="Attendance" unit="%" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="finalMarks" name="Final" stroke="#64748b" fontSize={12} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} {...TOOLTIP_STYLE} />
              <Scatter data={attendanceData} fill="#8b5cf6" fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Study Hours vs Marks */}
        <div className="chart-card">
          <h3>📚 Study Hours vs Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="studyHours" name="Study Hours" unit="h" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="finalMarks" name="Final" stroke="#64748b" fontSize={12} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Scatter data={studyData} fill="#06b6d4" fillOpacity={0.65} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="chart-card">
          <h3>📊 Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="range" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distData.map((_, idx) => (
                  <Cell key={idx} fill={idx < 2 ? '#ef4444' : idx < 4 ? '#f59e0b' : '#10b981'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution Pie */}
        <div className="chart-card">
          <h3>🎯 Grade Distribution</h3>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={gradeData} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={95}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {gradeData.map((entry, idx) => (
                    <Cell key={idx} fill={GRADE_COLORS[entry.name] || COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              No predictions yet. Run predictions to see grade distribution.
            </div>
          )}
        </div>
      </div>

      {/* ── Top & Weak Students ── */}
      {(topWeak.topStudents.length > 0 || topWeak.weakStudents.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
          {/* Top Students */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h3 style={{ marginBottom: '16px', color: '#10b981' }}>🏆 Top Performers</h3>
            {topWeak.topStudents.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < topWeak.topStudents.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                    background: i === 0 ? 'rgba(251,191,36,0.25)' : i === 1 ? 'rgba(156,163,175,0.2)' : 'rgba(180,120,60,0.2)',
                    color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : '#b47c3c'
                  }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Att: {s.attendance?.toFixed(1)}%</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '16px' }}>{s.predictedMarks?.toFixed(1)}</span>
                  <GradeBadge grade={s.grade} />
                </div>
              </div>
            ))}
          </div>

          {/* Weak Students */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h3 style={{ marginBottom: '16px', color: '#ef4444' }}>⚠️ Needs Attention</h3>
            {topWeak.weakStudents.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < topWeak.weakStudents.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                  }}>⚠️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Att: {s.attendance?.toFixed(1)}%</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '16px' }}>{s.predictedMarks?.toFixed(1)}</span>
                  <GradeBadge grade={s.grade} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Student Submissions ── */}
      {overview?.recentSubmissions?.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>📤 Recent Student Submissions</h3>
            <a href="/students" style={{ fontSize: '13px', color: 'var(--accent-purple)', textDecoration: 'none' }}>View all →</a>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Predicted Marks</th>
                  <th>Grade</th>
                  <th>Attendance</th>
                  <th>Study Hours</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentSubmissions.map((sub, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{sub.studentName}</td>
                    <td style={{ fontWeight: 700, color: sub.predictedMarks >= 70 ? '#10b981' : sub.predictedMarks >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {sub.predictedMarks ? sub.predictedMarks.toFixed(1) : '—'}
                    </td>
                    <td><GradeBadge grade={sub.grade} /></td>
                    <td style={{ color: sub.features?.attendance < 75 ? '#f59e0b' : '#10b981' }}>
                      {sub.features?.attendance?.toFixed(1)}%
                    </td>
                    <td>{sub.features?.studyHours?.toFixed(1)}h</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(sub.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
