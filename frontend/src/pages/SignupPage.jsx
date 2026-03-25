/**
 * Signup Page
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await register(form);
      loginUser(data.data);
      toast.success(`Welcome, ${data.data.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join the Student Performance Analytics platform</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" className="form-input" placeholder="John Doe" value={form.name} onChange={handleChange} id="signup-name" />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={handleChange} id="signup-email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" className="form-input" placeholder="Min 6 characters" value={form.password} onChange={handleChange} id="signup-password" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" className="form-input" value={form.role} onChange={handleChange} id="signup-role">
              <option value="student">Student</option>
              <option value="teacher">Teacher (Admin)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} id="signup-submit">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
