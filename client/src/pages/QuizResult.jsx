import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

function QuizResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, totalMarks, passed, skillId, wrongQuestions = [] } = location.state || {};

  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (score === undefined) {
      navigate('/quiz-landing', { replace: true });
    }
  }, [score, navigate]);

  if (score === undefined) {
    return <Layout><p className="text-[#9A9890]">Redirecting...</p></Layout>;
  }

  const handleRatingSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await axios.post(
        '/api/profile/self-rating',
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
      <div className="relative -mx-6 px-6 -mt-10 pt-10 pb-10 dot-grid overflow-hidden min-h-[80vh]">
        <div className="absolute top-16 left-10 w-64 h-64 bg-teal-brand/[0.06] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] pointer-events-none"></div>
        <div className="absolute bottom-16 right-10 w-64 h-64 bg-violet-brand/[0.06] rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s] pointer-events-none"></div>

        <div className="relative max-w-3xl mx-auto">
          {/* Score card */}
          <div className="bg-white border border-[#E7E5DD] rounded-xl p-8 text-center animate-fade-in-up" style={{ opacity: 0 }}>
            {passed ? (
              <>
                <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-full bg-teal-bg text-teal-text border-2 border-teal-brand/30 mb-6">
                  <span className="absolute inset-0 rounded-full bg-teal-brand/10 animate-ping"></span>
                  <p className="font-display text-3xl font-semibold relative z-10">{score}/{totalMarks}</p>
                </div>

                <h1 className="font-display text-xl font-semibold text-teal-text mb-1">You passed! 🎉</h1>
                <p className="text-sm text-[#6B6E76] mb-6">This skill is now verified on your profile.</p>

                <div className="max-w-xs mx-auto">
                  <p className="text-[#6B6E76] mb-3 text-sm">Rate your confidence in this skill (1-10):</p>
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
                </div>
              </>
            ) : (
              <>
                <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-full bg-[#FCEBEB] text-[#791F1F] border-2 border-[#F7C1C1] mb-6">
                  <p className="font-display text-3xl font-semibold relative z-10">{score}/{totalMarks}</p>
                </div>

                <h1 className="font-display text-xl font-semibold text-[#791F1F] mb-1">Not quite — you need 48/50 to pass</h1>
                <p className="text-[#6B6E76] mb-6 text-sm">You can retry this quiz in 24 hours.</p>
                <button
                  onClick={() => navigate('/quiz-landing')}
                  className="bg-[#F1EFE8] text-ink px-6 py-2.5 rounded-lg font-medium hover:bg-[#E7E5DD] transition-colors"
                >
                  Back to quiz landing
                </button>
              </>
            )}
          </div>

          {/* What's next — only shown on pass, fills the page with useful follow-ups */}
          {passed && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 animate-fade-in-up" style={{ animationDelay: '100ms', opacity: 0 }}>
              <Link to="/find-match" className="bg-white border border-[#E7E5DD] rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <p className="font-display font-semibold text-ink text-sm mb-1">Find a match</p>
                <p className="text-xs text-[#6B6E76]">Put this skill to use and teach someone.</p>
              </Link>
              <Link to="/quiz-landing" className="bg-white border border-[#E7E5DD] rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <p className="font-display font-semibold text-ink text-sm mb-1">Verify another skill</p>
                <p className="text-xs text-[#6B6E76]">Add more skills to unlock more matches.</p>
              </Link>
              <Link to="/feed" className="bg-white border border-[#E7E5DD] rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <p className="font-display font-semibold text-ink text-sm mb-1">Browse the feed</p>
                <p className="text-xs text-[#6B6E76]">See what others have built.</p>
              </Link>
            </div>
          )}

          {/* Wrong answers review — shown whenever any exist, pass or fail */}
          {wrongQuestions.length > 0 && (
            <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>
              <h2 className="font-display text-lg font-semibold text-ink mb-3">
                Review {wrongQuestions.length === 1 ? 'the question' : `${wrongQuestions.length} questions`} you missed
              </h2>
              <div className="space-y-3">
                {wrongQuestions.map((q, i) => (
                  <div key={i} className="bg-white border border-[#E7E5DD] rounded-xl p-5">
                    <p className="text-sm font-medium text-ink mb-3">{q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt) => {
                        const isCorrect = opt.id === q.correctOptionId;
                        const wasSelected = opt.id === q.yourAnswerId;
                        return (
                          <div
                            key={opt.id}
                            className={`text-sm px-3 py-2 rounded-lg border ${isCorrect
                                ? 'bg-teal-bg border-teal-brand/30 text-teal-text font-medium'
                                : wasSelected
                                  ? 'bg-[#FCEBEB] border-[#F7C1C1] text-[#791F1F]'
                                  : 'border-[#E7E5DD] text-[#9A9890]'
                              }`}
                          >
                            {opt.text}
                            {isCorrect && ' ✓ Correct answer'}
                            {wasSelected && !isCorrect && ' ✗ Your answer'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default QuizResult;