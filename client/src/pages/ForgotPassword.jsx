import { useState } from 'react';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white p-8 rounded-xl border border-[#E7E5DD] shadow-sm hover:shadow-md transition-shadow duration-300">
        <h1 className="font-display text-xl font-semibold text-ink mb-1">Reset password</h1>
        <p className="text-sm text-[#6B6E76] mb-6">We'll email you a link to set a new one.</p>

        {message && (
          <div className="bg-teal-bg text-teal-text p-3 rounded-lg mb-4 text-sm">{message}</div>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-sm text-[#6B6E76] text-center mt-5">
          <a href="/login" className="text-teal-text font-medium hover:underline">Back to login</a>
        </p>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;