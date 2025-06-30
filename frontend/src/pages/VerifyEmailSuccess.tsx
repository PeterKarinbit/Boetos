import React, { useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VerifyEmailSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Email Verified Successfully!
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your Boetos account has been activated. You now have access to all features including AI-powered burnout tracking, voice assistant, and personalized insights.
          </p>

          {/* Features List */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6 text-left">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Unlocked Features:
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>• AI-powered burnout tracking and prevention</li>
              <li>• Smart calendar management</li>
              <li>• Voice assistant capabilities</li>
              <li>• Memory and task management</li>
              <li>• Personalized insights and recommendations</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You'll be automatically redirected in 5 seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailSuccess; 