import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from '../firebase';
import { Survey } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, BarChart2, ExternalLink, Eye, EyeOff } from 'lucide-react';

export function AdminDashboard({ user }: { user: User }) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'surveys'), where('createdBy', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const surveyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));
      setSurveys(surveyData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this survey? All responses will be lost.')) {
      try {
        await deleteDoc(doc(db, 'surveys', id));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const togglePublish = async (survey: Survey) => {
    try {
      await updateDoc(doc(db, 'surveys', survey.id), {
        published: !survey.published
      });
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  if (loading) return <div className="text-center py-12">Loading surveys...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Your Surveys</h1>
          <p className="text-stone-500 mt-1">Manage and track your active surveys.</p>
        </div>
        <Link
          to="/admin/new"
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-md"
        >
          <Plus className="w-5 h-5" />
          New Survey
        </Link>
      </div>

      {surveys.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-stone-200 p-20 text-center">
          <div className="bg-stone-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-2">No surveys yet</h3>
          <p className="text-stone-500 mb-8">Create your first survey to start collecting insights.</p>
          <Link
            to="/admin/new"
            className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:underline"
          >
            Create survey now &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {surveys.map((survey) => (
            <div key={survey.id} className="bg-white rounded-3xl border border-stone-200 p-6 hover:border-emerald-200 transition-all group">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-stone-900">{survey.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${survey.published ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                      {survey.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-stone-500 text-sm line-clamp-1">{survey.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(survey)}
                    title={survey.published ? 'Unpublish' : 'Publish'}
                    className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
                  >
                    {survey.published ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <Link
                    to={`/admin/edit/${survey.id}`}
                    className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(survey.id)}
                    className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-stone-100 flex justify-between items-center">
                <div className="flex gap-4">
                  <Link
                    to={`/admin/results/${survey.id}`}
                    className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    <BarChart2 className="w-4 h-4" />
                    View Results
                  </Link>
                  {survey.published && (
                    <Link
                      to={`/survey/${survey.id}`}
                      target="_blank"
                      className="flex items-center gap-2 text-sm font-bold text-stone-600 hover:text-stone-900"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Public Link
                    </Link>
                  )}
                </div>
                <span className="text-xs text-stone-400 font-mono">
                  {survey.questions.length} Questions
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
