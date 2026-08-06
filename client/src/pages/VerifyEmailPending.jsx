import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';

function VerifyEmailPending() {
  const location = useLocation();
  const email = location.state?.email || '';
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/resend-verification', { email });
      setMessage('Verification email resent!');
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white p-8 rounded-xl border border-[#E7E5DD] shadow-sm hover:shadow-md transition-shadow duration-300 text-center">
        <h1 className="font-display text-xl font-semibold text-ink mb-2">Check your inbox</h1>
        <p className="text-sm text-[#6B6E76] mb-6">
          We've sent a verification link to <strong className="text-ink">{email}</strong>. Click it to activate your account.
        </p>

        {message && (
          <div className="bg-teal-bg text-teal-text p-3 rounded-lg mb-4 text-sm">{message}</div>
        )}

        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full bg-teal-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
        </button>

        <p className="text-sm text-[#6B6E76] mt-5">
          Wrong email? <a href="/signup" className="text-teal-text font-medium hover:underline">Go back to sign up</a>
        </p>
      </div>
    </AuthLayout>
  );
}

export default VerifyEmailPending;