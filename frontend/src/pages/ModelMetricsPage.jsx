/**
 * Model Metrics Page – ML model comparison, feature importance visualization
 */
import { useState, useEffect } from 'react';
import { getModelMetrics, getFeatureImportance } from '../services/api';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';

export default function ModelMetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [importance, setImportance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, impRes] = await Promise.all([
        getModelMetrics(),
        getFeatureImportance()
      ]);
      setMetrics(metricsRes.data.metrics);
      setImportance(impRes.data.feature_importance || []);
    } catch {
      toast.error('Failed to load metrics. Make sure ML service is running and models are trained.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  // Prepare comparison data for bar chart
  const comparisonData = metrics ? Object.entries(metrics).map(([name, m]) => ({
    name: name.replace('Regression', 'Reg.').replace('Decision', 'Dec.'),
    'R² Score': m.r2,
    'MAE': m.mae,
    'RMSE': m.rmse,
    'CV Mean': m.cv_mean
  })) : [];

  // Determine best model
  const bestModel = metrics ? Object.entries(metrics).reduce((best, [name, m]) =>
    m.r2 > (best.r2 || 0) ? { name, ...m } : best, { r2: 0 }) : null;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>📈 Model Metrics</h1>
          <p>ML model comparison, performance metrics, and feature importance analysis</p>
        </div>
      </div>

      {/* Model Cards */}
      {metrics && (
        <div className="stat-grid" style={{marginBottom:'28px'}}>
          {Object.entries(metrics).map(([name, m]) => (
            <div key={name} className="stat-card" style={name === bestModel?.name ? {borderColor:'var(--accent-green)', boxShadow:'0 0 20px rgba(16,185,129,0.15)'} : {}}>
              <div className={`stat-icon ${name.includes('Random') ? 'green' : name.includes('Linear') ? 'blue' : 'orange'}`}>
                {name.includes('Random') ? '🌲' : name.includes('Linear') ? '📏' : '🌳'}
              </div>
              <div className="stat-info" style={{flex:1}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
                  <h3 style={{fontSize:'16px'}}>{name}</h3>
                  {name === bestModel?.name && <span className="badge badge-a">Best</span>}
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px', fontSize:'13px'}}>
                  <span style={{color:'var(--text-muted)'}}>R²: <strong style={{color:'var(--text-primary)'}}>{m.r2}</strong></span>
                  <span style={{color:'var(--text-muted)'}}>MAE: <strong style={{color:'var(--text-primary)'}}>{m.mae}</strong></span>
                  <span style={{color:'var(--text-muted)'}}>RMSE: <strong style={{color:'var(--text-primary)'}}>{m.rmse}</strong></span>
                  <span style={{color:'var(--text-muted)'}}>CV: <strong style={{color:'var(--text-primary)'}}>{m.cv_mean} ± {m.cv_std}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="charts-grid">
        {/* Model Comparison Bar Chart */}
        <div className="chart-card">
          <h3>📊 Model Comparison – R² Score</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" domain={[0, 1]} stroke="#64748b" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
              />
              <Bar dataKey="R² Score" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="chart-card">
          <h3>🎯 Feature Importance (Random Forest)</h3>
          {importance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={importance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                />
                <Bar dataKey="importance" radius={[0, 6, 6, 0]} barSize={24}>
                  {importance.map((_, idx) => {
                    const colors = ['#8b5cf6', '#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#64748b', '#8b5cf6'];
                    return <Cell key={idx} fill={colors[idx % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{padding:'60px', textAlign:'center', color:'#64748b'}}>No feature importance data available.</div>
          )}
        </div>
      </div>

      {/* Error Metrics Comparison Table */}
      {metrics && (
        <div className="card" style={{marginTop:'24px'}}>
          <h3 style={{marginBottom:'16px'}}>📋 Detailed Metrics Comparison</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>R² Score</th>
                  <th>MAE</th>
                  <th>RMSE</th>
                  <th>CV Mean (R²)</th>
                  <th>CV Std</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics).map(([name, m]) => (
                  <tr key={name}>
                    <td style={{fontWeight:600}}>{name}</td>
                    <td style={{color: m.r2 > 0.7 ? '#10b981' : m.r2 > 0.5 ? '#f59e0b' : '#ef4444', fontWeight:700}}>{m.r2}</td>
                    <td>{m.mae}</td>
                    <td>{m.rmse}</td>
                    <td>{m.cv_mean}</td>
                    <td>{m.cv_std}</td>
                    <td>{name === bestModel?.name ? <span className="badge badge-a">Best</span> : <span className="badge" style={{background:'rgba(100,116,139,0.15)',color:'#64748b'}}>—</span>}</td>
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
