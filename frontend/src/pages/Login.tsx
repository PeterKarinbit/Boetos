import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();
  
  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/';

  // Get error from query params
  const searchParams = new URLSearchParams(location.search);
  const errorMsg = searchParams.get('error');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate passwords match for signup
      if (!isLogin && formData.password !== formData.confirmPassword) {
        // Add error handling for password mismatch
        return;
      }

      // Create user object matching User interface
      const userData = {
        id: '1', // You might want to generate this or get from your backend
        name: formData.name,
        email: formData.email,
        avatar: '', // Add default avatar or get from backend
        preferences: {
          notificationsEnabled: true,
          voiceCommandsEnabled: false,
          burnoutPreventionEnabled: true,
          focusHours: {
            start: 9,
            end: 17
          }
        }
      };
      
      // Call login function from UserContext
      login(userData);
      
      // Navigate to the originally requested page or dashboard
      navigate(from, { replace: true });
    } catch (error) {
      // Add error handling here
      console.error('Authentication error:', error);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto p-4 sm:p-8 bg-emerald-900 rounded-lg shadow-lg">
        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-center font-semibold">
            {decodeURIComponent(errorMsg)}
          </div>
        )}
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/assets/images/boetos-logo.png"
              alt="Boetos Logo"
              className="w-16 h-16 rounded-2xl shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-emerald-100 mb-2">Boetos</h1>
          <p className="text-emerald-200">AI Assistant for Entrepreneurs</p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Tab Headers */}
          <div className="flex bg-white/20 rounded-2xl p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                isLogin 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                !isLogin 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field - Only for signup */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-white/90">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 text-white placeholder-white/60"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 text-white placeholder-white/60"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-12 py-3 bg-white/20 border border-white/30 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 text-white placeholder-white/60"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field - Only for signup */}
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 text-white placeholder-white/60"
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Forgot Password Link - Only for login */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-emerald-300 hover:text-white font-medium transition-colors duration-200"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-emerald-900/50 text-white/80">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/20 border border-white/30 rounded-xl hover:bg-white/30 transition-colors duration-200 text-white"
              onClick={() => window.location.href = 'http://localhost:4000/api/auth/google'}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Bottom Text */}
          <p className="text-center text-sm text-white/70 mt-8">
            By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
            <button className="text-emerald-300 hover:text-white font-medium transition-colors duration-200">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-emerald-300 hover:text-white font-medium transition-colors duration-200">
              Privacy Policy
            </button>
          </p>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8">
          <p className="text-emerald-200">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={toggleMode}
              className="text-emerald-300 hover:text-white font-medium transition-colors duration-200"
            >
              {isLogin ? 'Sign up for free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;