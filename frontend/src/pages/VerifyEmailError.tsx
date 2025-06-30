import React from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VerifyEmailError: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Email Verification Failed
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The verification link may be invalid, expired, or already used. Please try requesting a new verification email or contact support if the problem persists.
          </p>

          {/* Possible Reasons */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6 text-left">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Possible reasons:
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>• The verification link has expired (24 hours)</li>
              <li>• The link has already been used</li>
              <li>• The link was copied incorrectly</li>
              <li>• Your account may already be verified</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
            
            <button
              onClick={() => navigate('/resend-verification')}
              className="w-full py-3 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Request New Verification Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailError; 