import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from '../firebase';
import { Survey, Question } from '../types';
import { Plus, Trash2, Save, ArrowLeft, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

export function SurveyEditor({ user }: { user: User }) {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!surveyId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (surveyId) {
      const fetchSurvey = async () => {
        try {
          const docRef = doc(db, 'surveys', surveyId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Survey;
            setTitle(data.title);
            setDescription(data.description);
            setQuestions(data.questions);
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

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      type: 'text',
      options: []
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addOption = (qId: string) => {
    const question = questions.find(q => q.id === qId);
    if (question) {
      const options = [...(question.options || []), ''];
      updateQuestion(qId, { options });
    }
  };

  const updateOption = (qId: string, optIndex: number, value: string) => {
    const question = questions.find(q => q.id === qId);
    if (question && question.options) {
      const options = [...question.options];
      options[optIndex] = value;
      updateQuestion(qId, { options });
    }
  };

  const removeOption = (qId: string, optIndex: number) => {
    const question = questions.find(q => q.id === qId);
    if (question && question.options) {
      const options = question.options.filter((_, i) => i !== optIndex);
      updateQuestion(qId, { options });
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert('Please enter a survey title');
    if (questions.length === 0) return alert('Please add at least one question');

    setSaving(true);
    try {
      const surveyData = {
        title,
        description,
        questions,
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        published: false
      };

      if (surveyId) {
        await setDoc(doc(db, 'surveys', surveyId), {
          ...surveyData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await addDoc(collection(db, 'surveys'), {
          ...surveyData,
          createdAt: serverTimestamp(),
          published: true // Default to published for new ones for demo
        });
      }
      navigate('/admin');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save survey');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading editor...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Survey'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6 shadow-sm">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Survey Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl font-bold border-none focus:ring-0 placeholder:text-stone-200 p-0"
          />
          <textarea
            placeholder="Add a description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-lg text-stone-500 border-none focus:ring-0 placeholder:text-stone-200 p-0 resize-none"
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white rounded-3xl border border-stone-200 p-8 space-y-6 group relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="w-5 h-5 text-stone-300" />
            </div>
            
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-stone-400 uppercase tracking-widest">Question {index + 1}</span>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, { type: e.target.value as any })}
                    className="text-xs font-bold uppercase tracking-wider bg-stone-50 border-none rounded-lg px-3 py-1 text-stone-600 focus:ring-emerald-500"
                  >
                    <option value="text">Text Input</option>
                    <option value="multiple-choice">Multiple Choice</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Enter your question"
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                  className="w-full text-xl font-semibold border-none focus:ring-0 placeholder:text-stone-200 p-0"
                />
              </div>
              <button
                onClick={() => removeQuestion(q.id)}
                className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {q.type === 'multiple-choice' && (
              <div className="space-y-3 pl-4 border-l-2 border-stone-100">
                {q.options?.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-stone-200" />
                    <input
                      type="text"
                      placeholder={`Option ${optIdx + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                      className="flex-1 text-stone-600 border-none focus:ring-0 p-0"
                    />
                    <button
                      onClick={() => removeOption(q.id, optIdx)}
                      className="p-1 text-stone-300 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addOption(q.id)}
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full py-8 bg-white rounded-3xl border-2 border-dashed border-stone-200 text-stone-400 font-bold hover:border-emerald-200 hover:text-emerald-600 transition-all flex flex-col items-center justify-center gap-2"
        >
          <Plus className="w-8 h-8" />
          Add Question
        </button>
      </div>
    </div>
  );
}
