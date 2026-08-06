import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

function QuizAttempt() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(location.state?.questions || null);
  const [expiresAt, setExpiresAt] = useState(location.state?.expiresAt || null);
  const [skillName, setSkillName] = useState(location.state?.skillName || '');
  const [loadingSession, setLoadingSession] = useState(!location.state?.questions);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);

  // Effect 1: get the questions, either already present or fetched fresh
  useEffect(() => {
    if (questions) {
      setLoadingSession(false);
      return;
    }

    async function fetchSession() {
      try {
        const res = await axios.get(`http://localhost:5000/api/quiz/session/${sessionId}`, { withCredentials: true });
        setQuestions(res.data.questions);
        setExpiresAt(res.data.expiresAt);
        setSkillName(res.data.skillName);
      } catch (err) {
        navigate('/quiz-landing', { replace: true });
      } finally {
        setLoadingSession(false);
      }
    }
    fetchSession();
  }, [sessionId]);

  // Effect 2: ALWAYS try to restore saved progress, regardless of where the questions came from
  useEffect(() => {
    const saved = sessionStorage.getItem(`quiz-progress-${sessionId}`);
    if (saved) {
      const { answers: savedAnswers, currentIndex: savedIndex } = JSON.parse(saved);
      setAnswers(savedAnswers);
      setCurrentIndex(savedIndex);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = new Date(expiresAt) - new Date();
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (sessionId && answers.length > 0) {
      sessionStorage.setItem(`quiz-progress-${sessionId}`, JSON.stringify({ answers, currentIndex }));
    }
  }, [answers, currentIndex, sessionId]);

  if (loadingSession) return <Layout><p className="text-[#9A9890] p-4 text-center">Loading your quiz...</p></Layout>;
  if (!questions) return null;

  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const currentQuestion = questions[currentIndex];

  const formatTime = (ms) => {
    if (ms === null) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleNext = async () => {
    const updatedAnswers = [...answers, { questionIndex: currentIndex, selectedOptionId: selectedOption }];
    setAnswers(updatedAnswers);
    setSelectedOption(null);

    if (isLastQuestion) {
      await handleSubmit(updatedAnswers);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = async (finalAnswers) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await axios.post(
        'http://localhost:5000/api/quiz/submit',
        { sessionId, answers: finalAnswers },
        { withCredentials: true }
      );
      sessionStorage.removeItem(`quiz-progress-${sessionId}`);
      navigate('/quiz-result', { state: res.data });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong submitting the quiz');
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="relative -mx-6 px-6 -mt-10 pt-10 pb-6 dot-grid overflow-hidden min-h-[80vh]">
        <div className="absolute top-20 right-10 w-64 h-64 bg-teal-brand/[0.05] rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite] pointer-events-none"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-violet-brand/[0.05] rounded-full blur-3xl animate-[float_7s_ease-in-out_infinite_1s] pointer-events-none"></div>

        <div className="relative max-w-2xl mx-auto">
          <div className="mb-5 animate-fade-in-up" style={{ opacity: 0 }}>
            <h1 className="font-display text-xl font-semibold text-ink">
              {skillName ? `${skillName} Quiz` : 'Skill Quiz'}
            </h1>
            <p className="text-sm text-[#6B6E76] mt-0.5">Answer all 25 questions to verify this skill.</p>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-[#9A9890]">Question {currentIndex + 1} of {totalQuestions}</span>
            {timeLeft !== null && (
              <span className={`text-sm font-medium ${timeLeft < 60000 ? 'text-[#791F1F]' : 'text-[#6B6E76]'}`}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>

          <div className="w-full bg-[#F1EFE8] rounded-full h-1.5 mb-6">
            <div
              className="bg-teal-brand h-1.5 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          {error && (
            <div className="bg-[#FCEBEB] text-[#791F1F] p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <div className="bg-white border border-[#E7E5DD] rounded-xl p-6">
            <p className="text-lg font-medium text-ink mb-5">{currentQuestion.question}</p>

            <div className="space-y-3">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    selectedOption === opt.id
                      ? 'border-teal-brand bg-teal-bg text-teal-text'
                      : 'border-[#E7E5DD] hover:bg-[#F5F4EF] text-[#3D3D3A]'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedOption || submitting}
              className="w-full mt-6 bg-teal-brand text-white py-2.5 rounded-lg font-medium hover:bg-teal-brand/90 disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Submitting...' : isLastQuestion ? 'Submit quiz' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default QuizAttempt;