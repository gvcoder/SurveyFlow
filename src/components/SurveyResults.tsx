import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useParams, Link } from 'react-router-dom';
import { db, doc, getDoc, collection, query, where, onSnapshot } from '../firebase';
import { Survey, SurveyResponse } from '../types';
import { ArrowLeft, Users, Calendar, BarChart3, MessageSquare } from 'lucide-react';

export function SurveyResults({ user }: { user: User }) {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (surveyId) {
      const fetchSurvey = async () => {
        const docRef = doc(db, 'surveys', surveyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSurvey({ id: docSnap.id, ...docSnap.data() } as Survey);
        }
      };
      fetchSurvey();

      const q = query(collection(db, 'responses'), where('surveyId', '==', surveyId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setResponses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurveyResponse)));
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [surveyId]);

  if (loading) return <div className="text-center py-12">Loading results...</div>;
  if (!survey) return <div className="text-center py-12">Survey not found</div>;

  const getOptionCount = (qId: string, option: string) => {
    return responses.filter(r => r.answers[qId] === option).length;
  };

  const getOptionPercentage = (qId: string, option: string) => {
    if (responses.length === 0) return 0;
    return Math.round((getOptionCount(qId, option) / responses.length) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link
          to="/admin"
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-4 text-sm font-mono text-stone-400">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {responses.length} Responses
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Created {survey.createdAt?.toDate().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-stone-900 mb-2">{survey.title}</h1>
        <p className="text-stone-500 text-lg">{survey.description}</p>
      </div>

      <div className="space-y-6">
        {survey.questions.map((q, index) => (
          <div key={q.id} className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-mono text-stone-400 uppercase tracking-widest">Question {index + 1}</span>
                <h3 className="text-xl font-bold text-stone-900">{q.text}</h3>
              </div>
              <div className="bg-stone-50 p-2 rounded-xl">
                {q.type === 'multiple-choice' ? <BarChart3 className="w-5 h-5 text-emerald-600" /> : <MessageSquare className="w-5 h-5 text-emerald-600" />}
              </div>
            </div>

            {q.type === 'multiple-choice' ? (
              <div className="space-y-4">
                {q.options?.map((opt, i) => {
                  const percentage = getOptionPercentage(q.id, opt);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-stone-700">{opt}</span>
                        <span className="text-stone-400">{getOptionCount(q.id, opt)} ({percentage}%)</span>
                      </div>
                      <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Latest Responses</div>
                {responses.length === 0 ? (
                  <p className="text-stone-400 italic">No responses yet</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {responses.slice(-5).reverse().map((r, i) => (
                      <div key={i} className="p-4 bg-stone-50 rounded-2xl text-stone-700 border border-stone-100">
                        {r.answers[q.id] || <span className="text-stone-300 italic">No answer provided</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
