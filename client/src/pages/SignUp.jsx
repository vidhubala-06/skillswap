import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/signup', { email, password });
      navigate('/verify-email-pending', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
<AuthLayout>
  <div className="bg-white p-8 rounded-xl border border-[#E7E5DD] shadow-sm hover:shadow-md transition-shadow duration-300">
    <h1 className="font-display text-2xl font-semibold text-ink mb-1">Create your account</h1>
    <p className="text-sm text-[#6B6E76] mb-6">Start teaching and learning skills today.</p>

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
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Confirm password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>

    <p className="text-sm text-[#6B6E76] text-center mt-5">
      Already have an account? <a href="/login" className="text-teal-text font-medium hover:underline">Log in</a>
    </p>
  </div>
</AuthLayout>
  );
}

export default SignUp;