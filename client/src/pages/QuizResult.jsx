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
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-4xl font-bold text-gray-800 mb-2">{score}/{totalMarks}</p>

        {passed ? (
          <>
            <h1 className="text-xl font-bold text-green-600 mb-4">You passed! 🎉</h1>
            <p className="text-gray-600 mb-4 text-sm">Rate your confidence in this skill (1-10):</p>
            <input
              type="range"
              min="1"
              max="10"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full mb-2"
            />
            <p className="text-lg font-medium text-gray-700 mb-4">{rating}/10</p>

            {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}

            <button
              onClick={handleRatingSubmit}
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Confirm & Continue'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-red-600 mb-4">Not quite — you need 48/50 to pass</h1>
            <p className="text-gray-600 mb-6 text-sm">You can retry this quiz in 24 hours.</p>
            <button
              onClick={() => navigate('/quiz-landing')}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded font-medium hover:bg-gray-300"
            >
              Back to Quiz Landing
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}

export default QuizResult;