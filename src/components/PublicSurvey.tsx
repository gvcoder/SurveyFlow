import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, doc, getDoc, addDoc, collection, serverTimestamp } from '../firebase';
import { Survey } from '../types';
import { CheckCircle2, ChevronRight, Send } from 'lucide-react';

export function PublicSurvey() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (surveyId) {
      const fetchSurvey = async () => {
        try {
          const docRef = doc(db, 'surveys', surveyId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Survey;
            if (data.published) {
              setSurvey({ id: docSnap.id, ...data });
            }
          }
        } catch (error) {
          console.error('Fetch failed:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSurvey();
    }
  }, [surveyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Validate all questions are answered
    const unanswered = survey.questions.find(q => !answers[q.id]);
    if (unanswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'responses'), {
        surveyId: survey.id,
        answers,
        submittedAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (!survey) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
      <h1 className="text-3xl font-bold text-stone-900 mb-4">Survey not found</h1>
      <p className="text-stone-600 mb-8">This survey might be closed or the link is incorrect.</p>
      <Link to="/" className="text-emerald-600 font-bold hover:underline">Go to Home</Link>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
      <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="text-4xl font-bold text-stone-900 mb-4">Thank you!</h1>
      <p className="text-xl text-stone-600 max-w-md mb-10">Your response has been recorded. We appreciate your feedback.</p>
      <div className="pt-8 border-t border-stone-200">
        <p className="text-stone-400 text-sm mb-4">Powered by</p>
        <Link to="/" className="text-emerald-700 font-bold text-2xl tracking-tight">SurveyFlow</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl border border-stone-200 p-10 shadow-sm border-t-8 border-t-emerald-600">
          <h1 className="text-4xl font-bold text-stone-900 mb-4">{survey.title}</h1>
          {survey.description && <p className="text-lg text-stone-500 leading-relaxed">{survey.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {survey.questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono text-stone-400 uppercase tracking-widest">Question {index + 1}</span>
                <h3 className="text-xl font-bold text-stone-900">{q.text}</h3>
              </div>

              {q.type === 'text' ? (
                <textarea
                  required
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Type your answer here..."
                  className="w-full bg-stone-50 border-stone-200 rounded-2xl p-4 focus:ring-emerald-500 focus:border-emerald-500 text-stone-900 min-h-[120px]"
                />
              ) : (
                <div className="space-y-3">
                  {q.options?.map((opt, i) => (
                    <label key={i} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${answers[q.id] === opt ? 'border-emerald-600 bg-emerald-50' : 'border-stone-100 hover:border-stone-200'}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                        className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-stone-300"
                      />
                      <span className={`font-medium ${answers[q.id] === opt ? 'text-emerald-900' : 'text-stone-600'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-5 bg-emerald-600 text-white rounded-3xl text-xl font-bold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Submitting...' : (
              <>
                Submit Response
                <Send className="w-6 h-6" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-12 pb-8">
          <p className="text-stone-400 text-xs mb-2">Powered by</p>
          <Link to="/" className="text-emerald-700 font-bold text-xl tracking-tight opacity-50 hover:opacity-100 transition-opacity">SurveyFlow</Link>
        </div>
      </div>
    </div>
  );
}
