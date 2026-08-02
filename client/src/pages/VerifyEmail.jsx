import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }

    axios.post('http://localhost:5000/api/auth/verify-email', { token })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
        setTimeout(() => navigate('/login'), 2500);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed.');
      });
  }, [searchParams, navigate]);

  return (
    <AuthLayout>
      <div className="bg-white p-8 rounded-xl border border-[#E7E5DD] text-center">
        {status === 'verifying' && <p className="text-[#6B6E76] text-sm">Verifying your email...</p>}
        {status === 'success' && (
          <>
            <h1 className="font-display text-xl font-semibold text-teal-text mb-2">Email verified</h1>
            <p className="text-[#6B6E76] text-sm">{message} Redirecting to login...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="font-display text-xl font-semibold text-[#791F1F] mb-2">Verification failed</h1>
            <p className="text-[#6B6E76] text-sm">{message}</p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default VerifyEmail;