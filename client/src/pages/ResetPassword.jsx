import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const token = searchParams.get('token');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', { token, newPassword });
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white p-8 rounded-xl border border-[#E7E5DD] shadow-sm hover:shadow-md transition-shadow duration-300">
        <h1 className="font-display text-xl font-semibold text-ink mb-6">Set new password</h1>

        {error && (
          <div className="bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full border border-[#D8D6CC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Confirm new password</label>
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
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}

export default ResetPassword;