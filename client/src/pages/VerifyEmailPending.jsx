import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Check your inbox</h1>
        <p className="text-gray-600 mb-6">
          We've sent a verification link to <strong>{email}</strong>. Click it to activate your account.
        </p>

        {message && (
          <div className="bg-blue-100 text-blue-700 p-3 rounded mb-4 text-sm">{message}</div>
        )}

        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
        </button>

        <p className="text-sm text-gray-600 mt-4">
          Wrong email? <a href="/signup" className="text-blue-600 hover:underline">Go back to Sign Up</a>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailPending;