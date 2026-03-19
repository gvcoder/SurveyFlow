import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Layout } from './components/Layout';
import { AdminDashboard } from './components/AdminDashboard';
import { SurveyEditor } from './components/SurveyEditor';
import { PublicSurvey } from './components/PublicSurvey';
import { SurveyResults } from './components/SurveyResults';
import { LogIn, LogOut, PlusCircle, ClipboardList } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
        <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2 text-emerald-700 font-bold text-xl tracking-tight">
                  <ClipboardList className="w-6 h-6" />
                  SurveyFlow
                </Link>
              </div>

              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <Link 
                      to="/admin" 
                      className="text-stone-600 hover:text-emerald-600 font-medium text-sm transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-200">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Avatar" referrerPolicy="no-referrer" />
                    </div>
                  </>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    Admin Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home user={user} onLogin={handleLogin} />} />
            <Route path="/survey/:surveyId" element={<PublicSurvey />} />
            <Route 
              path="/admin" 
              element={user ? <AdminDashboard user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/admin/new" 
              element={user ? <SurveyEditor user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/admin/edit/:surveyId" 
              element={user ? <SurveyEditor user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/admin/results/:surveyId" 
              element={user ? <SurveyResults user={user} /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home({ user, onLogin }: { user: User | null, onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-stone-900 mb-6">
        Create surveys that <br />
        <span className="text-emerald-600">actually get answered.</span>
      </h1>
      <p className="text-xl text-stone-600 max-w-2xl mb-10 leading-relaxed">
        SurveyFlow makes it easy to build, share, and analyze surveys. 
        Simple for you, seamless for your audience.
      </p>
      
      {user ? (
        <Link
          to="/admin"
          className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
        >
          <PlusCircle className="w-6 h-6" />
          Go to Dashboard
        </Link>
      ) : (
        <button
          onClick={onLogin}
          className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-lg font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200"
        >
          Get Started for Free
        </button>
      )}

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {[
          { title: 'Simple Editor', desc: 'Build surveys in minutes with our intuitive drag-and-drop interface.' },
          { title: 'Public Links', desc: 'Share your survey with anyone via a simple, open URL.' },
          { title: 'Real-time Results', desc: 'Watch responses roll in and analyze them instantly.' }
        ].map((feature, i) => (
          <div key={i} className="p-8 bg-white rounded-3xl border border-stone-200 text-left hover:border-emerald-200 transition-colors">
            <h3 className="text-xl font-bold mb-3 text-stone-900">{feature.title}</h3>
            <p className="text-stone-600 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
