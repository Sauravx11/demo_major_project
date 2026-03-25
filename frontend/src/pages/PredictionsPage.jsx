/**
 * Predictions Page – view and trigger ML predictions with recommendations
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPredictions, predictAll, getStudents, predictStudent } from '../services/api';
import toast from 'react-hot-toast';

export default function PredictionsPage() {
  const { isTeacher } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedPred, setSelectedPred] = useState(null);

  useEffect(() => { fetchPredictions(1); }, []);

  const fetchPredictions = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await getPredictions({ page, limit: 20 });
      setPredictions(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictAll = async () => {
    if (!window.confirm('Run ML predictions for ALL students?')) return;
    setPredicting(true);
    try {
      const { data } = await predictAll();
      toast.success(data.message || 'Predictions generated!');
      fetchPredictions(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Prediction failed. Make sure ML service is running and models are trained.');
    } finally {
      setPredicting(false);
    }
  };

  const getGradeBadge = (grade) => {
    const cls = { A: 'badge-a', B: 'badge-b', C: 'badge-c', Fail: 'badge-fail' };
    return <span className={`badge ${cls[grade] || ''}`}>{grade}</span>;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🤖 Predictions</h1>
          <p>ML-powered performance predictions with smart recommendations</p>
        </div>
        {isTeacher && (
          <button className="btn btn-primary" onClick={handlePredictAll} disabled={predicting}>
            {predicting ? '⏳ Running...' : '🔮 Predict All Students'}
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Predicted Marks</th>
                    <th>Grade</th>
                    <th>Model</th>
                    <th>Date</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map(p => (
                    <tr key={p._id}>
                      <td style={{fontWeight:600}}>{p.studentId?.name || '—'}</td>
                      <td style={{color:'var(--accent-purple)'}}>{p.studentId?.studentId || '—'}</td>
                      <td style={{fontWeight:700, fontSize:'16px'}}>{p.predictedMarks?.toFixed(1)}</td>
                      <td>{getGradeBadge(p.grade)}</td>
                      <td style={{color:'var(--text-muted)', fontSize:'13px'}}>{p.modelUsed}</td>
                      <td style={{color:'var(--text-muted)', fontSize:'13px'}}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelectedPred(p)}>View</button>
                      </td>
                    </tr>
                  ))}
                  {predictions.length === 0 && (
                    <tr><td colSpan="7" style={{textAlign:'center',padding:'40px',color:'#64748b'}}>
                      No predictions yet. Upload a dataset and click "Predict All Students".
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button disabled={pagination.page <= 1} onClick={() => fetchPredictions(pagination.page - 1)}>← Prev</button>
                {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                  const p = i + 1;
                  return <button key={p} className={pagination.page === p ? 'active' : ''} onClick={() => fetchPredictions(p)}>{p}</button>;
                })}
                <button disabled={pagination.page >= pagination.pages} onClick={() => fetchPredictions(pagination.page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPred && (
        <div className="modal-overlay" onClick={() => setSelectedPred(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>🔍 Prediction Details</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px'}}>
              <div className="metric-card">
                <div className="metric-value">{selectedPred.predictedMarks?.toFixed(1)}</div>
                <div className="metric-label">Predicted Marks</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{selectedPred.grade}</div>
                <div className="metric-label">Grade</div>
              </div>
            </div>

            {selectedPred.features && (
              <div style={{marginBottom:'20px'}}>
                <h3 style={{fontSize:'14px', fontWeight:600, marginBottom:'12px'}}>📋 Input Features</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {Object.entries(selectedPred.features).map(([key, val]) => (
                    <div key={key} style={{padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'8px', fontSize:'13px'}}>
                      <span style={{color:'#64748b'}}>{key}: </span>
                      <span style={{fontWeight:600}}>{typeof val === 'number' ? val.toFixed(1) : val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPred.recommendations?.length > 0 && (
              <div>
                <h3 style={{fontSize:'14px', fontWeight:600, marginBottom:'12px'}}>💡 Recommendations</h3>
                <ul className="recommendation-list">
                  {selectedPred.recommendations.map((r, i) => (
                    <li key={i} className="recommendation-item">{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedPred(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
