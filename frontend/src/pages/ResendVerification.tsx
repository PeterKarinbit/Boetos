import React, { useState, useEffect } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ResendVerification: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.post('/api/auth/resend-verification', { email });
      setIsSuccess(true);
      setCountdown(60); // Start 60-second countdown
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
              Verification Email Sent!
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              We've sent a new verification email to <strong>{email}</strong>. Please check your inbox and click the verification link to activate your account.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-6 text-left">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What to do next:
              </h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the "Verify Email Address" button</li>
                <li>• You'll be redirected to your dashboard</li>
              </ul>
            </div>

            {/* Resend button with timer */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setCountdown(0);
                }}
                disabled={countdown > 0}
                className={`w-full py-3 px-4 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${
                  countdown > 0
                    ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Mail className="w-4 h-4" />
                {countdown > 0 
                  ? `Resend available in ${countdown}s` 
                  : 'Send Another Email'
                }
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-lg shadow-md transition-all duration-300"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/assets/images/boetos-logo.png"
                alt="Boetos Logo"
                className="w-12 h-12 rounded-xl shadow-lg"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resend Verification Email</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Enter your email address to receive a new verification link.<br/>
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">Verification is optional for now. You can skip this step and continue using Boetos, but some features may be limited until you verify your email.</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded text-center font-semibold bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || countdown > 0}
              className={`w-full py-3 px-4 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${
                isLoading || countdown > 0
                  ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? (
                <span>Sending...</span>
              ) : countdown > 0 ? (
                <>
                  <span>Resend available in {countdown}s</span>
                </>
              ) : (
                <>
                  Send Verification Email
                  <Mail className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login and Cancel */}
          <div className="mt-6 text-center flex flex-col gap-2">
            <button
              onClick={() => navigate('/login')}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 flex items-center justify-center gap-2 mx-auto font-semibold"
            >
              Cancel and Continue Without Verifying
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification; 