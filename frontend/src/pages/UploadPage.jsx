/**
 * CSV Upload Page – drag & drop CSV file upload with progress
 */
import { useState, useRef } from 'react';
import { uploadCSV, trainModels } from '../services/api';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped);
    } else {
      toast.error('Please drop a CSV file');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a CSV file first');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await uploadCSV(formData);
      setResult(data);
      toast.success(data.message || 'Upload successful!');
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    try {
      const { data } = await trainModels();
      toast.success('Models trained successfully!');
      setResult(prev => ({ ...prev, training: data.data }));
    } catch (err) {
      toast.error('Training failed. Make sure ML service is running.');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>📁 Upload Dataset</h1>
          <p>Upload a CSV file to import student data and retrain ML models</p>
        </div>
      </div>

      <div className="card" style={{marginBottom:'24px'}}>
        <div
          className="upload-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="upload-icon">📁</div>
          {file ? (
            <>
              <p style={{fontSize:'16px', fontWeight:600, color:'var(--accent-green)', marginBottom:'4px'}}>✅ {file.name}</p>
              <p>{(file.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <p style={{fontSize:'16px', fontWeight:600, marginBottom:'4px'}}>Drop your CSV file here</p>
              <p>or click to browse. Required columns: attendance, study_hours, internal_marks, prev_marks, assignment_score, sleep_hours, participation, test_avg, backlogs, final_marks</p>
            </>
          )}
        </div>
        <input type="file" ref={fileRef} accept=".csv" onChange={handleFileSelect} style={{display:'none'}} />

        <div style={{display:'flex', gap:'12px', marginTop:'20px'}}>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? '⏳ Uploading...' : '📤 Upload & Import'}
          </button>
          <button className="btn btn-secondary" onClick={handleTrain} disabled={training}>
            {training ? '⏳ Training...' : '🧠 Train ML Models'}
          </button>
        </div>
      </div>

      {result && (
        <div className="card fade-in">
          <h3 style={{marginBottom:'16px'}}>✅ Upload Result</h3>
          <p style={{color:'var(--text-secondary)', marginBottom:'12px'}}>{result.message}</p>
          {result.count && <p>📊 Records imported: <strong>{result.count}</strong></p>}

          {result.training && (
            <div style={{marginTop:'20px'}}>
              <h3 style={{marginBottom:'12px'}}>🧠 Training Results</h3>
              <p>Best Model: <strong style={{color:'var(--accent-green)'}}>{result.training.best_model}</strong></p>

              {result.training.metrics && (
                <div className="metrics-grid" style={{marginTop:'16px'}}>
                  {Object.entries(result.training.metrics).map(([name, m]) => (
                    <div key={name} className="metric-card">
                      <div style={{fontSize:'13px', fontWeight:600, marginBottom:'8px', color:'var(--accent-purple)'}}>{name}</div>
                      <div style={{fontSize:'13px'}}>
                        <div>R²: <strong>{m.r2}</strong></div>
                        <div>MAE: <strong>{m.mae}</strong></div>
                        <div>RMSE: <strong>{m.rmse}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{marginTop:'24px'}}>
        <h3 style={{marginBottom:'16px'}}>📋 CSV Format Guide</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Description</th>
                <th>Range</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>student_id</td><td>Integer</td><td>Unique student identifier</td><td>1-2000</td></tr>
              <tr><td>attendance</td><td>Float</td><td>Attendance percentage</td><td>0-100</td></tr>
              <tr><td>study_hours</td><td>Float</td><td>Daily study hours</td><td>0-10</td></tr>
              <tr><td>internal_marks</td><td>Float</td><td>Internal assessment score</td><td>0-100</td></tr>
              <tr><td>prev_marks</td><td>Float</td><td>Previous semester marks</td><td>0-100</td></tr>
              <tr><td>assignment_score</td><td>Float</td><td>Assignment completion score</td><td>0-100</td></tr>
              <tr><td>sleep_hours</td><td>Float</td><td>Average sleep hours per night</td><td>4-9</td></tr>
              <tr><td>participation</td><td>Integer</td><td>Class participation (0=No, 1=Yes)</td><td>0-1</td></tr>
              <tr><td>test_avg</td><td>Float</td><td>Average test score</td><td>0-100</td></tr>
              <tr><td>backlogs</td><td>Integer</td><td>Number of backlogs</td><td>0-5</td></tr>
              <tr><td>final_marks</td><td>Float</td><td>Final marks (target variable)</td><td>0-100</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
