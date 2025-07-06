import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Input from './Input';
import Button from './Button';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="w-full"
    >
      <h2 className="text-3xl font-bold text-[#FFB347] mb-2 text-center">Welcome Back!</h2>
      <p className="text-[#FFB347]/80 text-center mb-8">Enter your email and password</p>
      {error && (
        <div className="mb-6 p-3 rounded-xl bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/30 text-center font-semibold animate-pulse">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter your email"
          required
        />
        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />
        <div className="flex justify-end mb-2">
          <button
            type="button"
            className="text-xs underline text-[#FFB347] hover:text-[#FF6A00] transition"
            onClick={() => alert('Forgot password flow coming soon!')}
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>
      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-[#FFB347]/30"></div>
        <span className="mx-4 text-xs text-[#FFB347]/60">or</span>
        <div className="flex-grow border-t border-[#FFB347]/30"></div>
      </div>
      <Button
        type="button"
        onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL}/api/oauth/google`; }}
        className="flex items-center justify-center gap-2 bg-white/10 text-[#FF6A00] hover:bg-white/20"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block mr-2"><g><path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-10.3 7-6.1 0-11-4.9-11-11s4.9-11 11-11c2.6 0 5 .9 6.9 2.6l6.6-6.6C34.5 6.5 29.7 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c10.5 0 19.5-8.5 19.5-19 0-1.3-.1-2.2-.3-3z"/><path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C15.1 16.1 19.2 13.5 24 13.5c2.6 0 5 .9 6.9 2.6l6.6-6.6C34.5 6.5 29.7 4.5 24 4.5c-7.1 0-13.2 3.7-16.7 9.6z"/><path fill="#4CAF50" d="M24 45.5c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.3c-2 1.4-4.5 2.2-7.6 2.2-4.6 0-8.7-2.7-10.3-7H6.2v5.6C9.7 41.3 16.3 45.5 24 45.5z"/><path fill="#1976D2" d="M43.6 20.5h-1.9V20H24v8h11.3c-0.7 2-2.1 3.7-3.9 4.9l6.5 5.3c-1.8 1.7-4.1 3.1-6.9 3.8V45.5c10.5 0 19.5-8.5 19.5-19 0-1.3-.1-2.2-.3-3z"/></g></svg>
        Continue with Google
      </Button>
    </motion.div>
  );
};

export default LoginForm; 