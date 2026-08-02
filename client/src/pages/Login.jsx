import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        { email, password },
        { withCredentials: true }
      );
      setUser(res.data.user);
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.error === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before logging in.');
      } else if (errData?.error === 'ACCOUNT_BANNED') {
        setError('Your account has been banned.');
      } else {
        setError(errData?.error || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
<AuthLayout>
  <div className="bg-white p-8 rounded-xl border border-[#E7E5DD]">
    <h1 className="font-display text-2xl font-semibold text-ink mb-1">Welcome back</h1>
    <p className="text-sm text-[#6B6E76] mb-6">Log in to continue swapping skills.</p>

    {error && (
      <div className="bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mb-4 text-sm">{error}</div>
    )}

    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
        />
      </div>
      <div className="text-right">
        <a href="/forgot-password" className="text-sm text-teal-text hover:underline">Forgot password?</a>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
      >
        {loading ? 'Logging in...' : 'Log in'}
      </button>
    </form>

    <p className="text-sm text-[#6B6E76] text-center mt-5">
      Don't have an account? <a href="/signup" className="text-teal-text font-medium hover:underline">Sign up</a>
    </p>
  </div>
</AuthLayout>
  );
}

export default Login;