import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, totalMarks, passed, skillId } = location.state || {};

  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (score === undefined) {
      navigate('/quiz-landing', { replace: true });
    }
  }, [score, navigate]);

  if (score === undefined) {
    return <Layout><p className="text-gray-500">Redirecting...</p></Layout>;
  }

  const handleRatingSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await axios.post(
        'http://localhost:5000/api/profile/self-rating',
        { skillId, rating },
        { withCredentials: true }
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white border border-[#E7E5DD] rounded-xl p-8 text-center">
        <p className="font-display text-4xl font-semibold text-ink mb-2">{score}/{totalMarks}</p>

        {passed ? (
          <>
            <h1 className="font-display text-xl font-semibold text-teal-text mb-4">You passed!</h1>
            <p className="text-[#6B6E76] mb-4 text-sm">Rate your confidence in this skill (1-10):</p>
            <input
              type="range"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full mb-2 accent-teal-brand"
            />
            <p className="text-lg font-medium text-ink mb-4">{rating}/10</p>

            {error && <div className="bg-[#FCEBEB] text-[#791F1F] p-2 rounded-lg mb-3 text-sm">{error}</div>}

            <button
              onClick={handleRatingSubmit}
              disabled={submitting}
              className="w-full bg-teal-brand text-white py-2.5 rounded-lg font-medium hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Saving...' : 'Confirm and continue'}
            </button>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl font-semibold text-[#791F1F] mb-4">Not quite — you need 48/50 to pass</h1>
            <p className="text-[#6B6E76] mb-6 text-sm">You can retry this quiz in 24 hours.</p>
            <button
              onClick={() => navigate('/quiz-landing')}
              className="w-full bg-[#F1EFE8] text-ink py-2.5 rounded-lg font-medium hover:bg-[#E7E5DD] transition-colors"
            >
              Back to quiz landing
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}

export default QuizResult;