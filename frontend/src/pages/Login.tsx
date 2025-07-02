import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sun, Moon, Zap, Cpu, Globe, Brain, Clock, MessageSquare, Calendar } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion';

// Enhanced Particle type with AI properties
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  type: 'thought' | 'memory' | 'data' | 'insight';
  color: string;
}

// AI Avatar types
interface AIAvatar {
  id: string;
  x: number;
  y: number;
  size: number;
  type: 'orb' | 'assistant' | 'insight' | 'helper';
  rotation: number;
  pulsePhase: number;
}

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [aiGreeting, setAiGreeting] = useState('');
  const [greetingIndex, setGreetingIndex] = useState(0);

  // Enhanced particle system with AI types
  const [particles, setParticles] = useState<Particle[]>([]);
  const [aiAvatars, setAiAvatars] = useState<AIAvatar[]>([]);
  const [cognitiveRings, setCognitiveRings] = useState<Array<{id: number, rotation: number, scale: number}>>([]);
  
  const canvasRef = useRef(null);
  const welcomeTimeout = useRef<NodeJS.Timeout | null>(null);
  const formRef = useRef(null);
  const isFormInView = useInView(formRef, { once: true, margin: '-100px' });

  // AI Greetings with contextual messages
  const aiGreetings = [
    "🧠 Good to see you again. Ready to master your day?",
    "⚡ Your AI companion is ready to amplify your productivity.",
    "🌌 Welcome back to your digital sanctuary of focus.",
    "🚀 Let's transform chaos into clarity together.",
    "💫 Your mind, enhanced. Your time, optimized."
  ];

  useEffect(() => {
    // Initialize enhanced particles with AI types
    const newParticles: Particle[] = Array.from({ length: 80 }, (_, i) => {
      const types = ['thought', 'memory', 'data', 'insight'] as const;
      const type = types[i % types.length];
      const colors = {
        thought: '#FFD580',
        memory: '#4ADE80', 
        data: '#60A5FA',
        insight: '#F59E0B'
      };
      
      return {
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.6 + 0.2,
        size: Math.random() * 3 + 1,
        type,
        color: colors[type]
      };
    });
    setParticles(newParticles);

    // Initialize AI Avatars
    const newAvatars: AIAvatar[] = [
      { id: 'orb', x: 100, y: 100, size: 40, type: 'orb', rotation: 0, pulsePhase: 0 },
      { id: 'assistant', x: window.innerWidth - 120, y: 80, size: 35, type: 'assistant', rotation: 0, pulsePhase: 0.5 },
      { id: 'insight', x: window.innerWidth - 150, y: window.innerHeight - 150, size: 50, type: 'insight', rotation: 0, pulsePhase: 0.8 },
      { id: 'helper1', x: 150, y: window.innerHeight - 120, size: 25, type: 'helper', rotation: 0, pulsePhase: 0.3 },
      { id: 'helper2', x: 200, y: 200, size: 20, type: 'helper', rotation: 0, pulsePhase: 0.7 },
    ];
    setAiAvatars(newAvatars);

    // Initialize cognitive rings
    const newRings = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      rotation: i * 72,
      scale: 1 + (i * 0.1)
    }));
    setCognitiveRings(newRings);

    // Set initial AI greeting
    setAiGreeting(aiGreetings[0]);
  }, []);

  // Breathing animation
  useEffect(() => {
    const breathingInterval = setInterval(() => {
      setBreathingPhase(prev => (prev + 0.02) % (2 * Math.PI));
    }, 50);
    return () => clearInterval(breathingInterval);
  }, []);

  // AI Greeting rotation
  useEffect(() => {
    const greetingInterval = setInterval(() => {
      setGreetingIndex(prev => (prev + 1) % aiGreetings.length);
      setAiGreeting(aiGreetings[greetingIndex]);
    }, 6000);
    return () => clearInterval(greetingInterval);
  }, [greetingIndex]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Enhanced particle animation with AI behavior
  useEffect(() => {
    const animateParticles = () => {
      setParticles((prev: Particle[]) => prev.map(particle => {
        // Add subtle attraction to mouse for interactive feel
        const dx = mousePosition.x - particle.x;
        const dy = mousePosition.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const attraction = distance < 200 ? (200 - distance) / 200 * 0.1 : 0;
        
        return {
        ...particle,
          x: (particle.x + particle.vx + dx * attraction + window.innerWidth) % window.innerWidth,
          y: (particle.y + particle.vy + dy * attraction + window.innerHeight) % window.innerHeight,
          opacity: particle.opacity + Math.sin(Date.now() * 0.001 + particle.id) * 0.1
        };
      }));
    };

    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, [mousePosition]);

  // AI Avatar animation
  useEffect(() => {
    const animateAvatars = () => {
      setAiAvatars(prev => prev.map(avatar => ({
        ...avatar,
        rotation: avatar.rotation + 0.5,
        pulsePhase: (avatar.pulsePhase + 0.02) % (2 * Math.PI)
      })));
    };

    const interval = setInterval(animateAvatars, 50);
    return () => clearInterval(interval);
  }, []);

  // Cognitive rings animation
  useEffect(() => {
    const animateRings = () => {
      setCognitiveRings(prev => prev.map(ring => ({
        ...ring,
        rotation: ring.rotation + 0.3,
        scale: 1 + Math.sin(Date.now() * 0.001 + ring.id) * 0.1
      })));
    };

    const interval = setInterval(animateRings, 50);
    return () => clearInterval(interval);
  }, []);

  const welcomeMessages = [
    "👋 First time here? You're about to get way more done.",
    "🧠 Let Boetos handle reminders, so you can handle focus.",
    "⏱️ Time-blocking, reminders, burnout tracking – all in one place."
  ];
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  
  useEffect(() => {
    if (welcomeTimeout.current) clearTimeout(welcomeTimeout.current);
    welcomeTimeout.current = setTimeout(() => {
      setWelcomeIndex((i) => (i + 1) % welcomeMessages.length);
    }, 4000);
    return () => { if (welcomeTimeout.current) clearTimeout(welcomeTimeout.current); };
  }, [welcomeIndex]);

  // Google OAuth callback handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/dashboard';
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Helper: Trigger Sidekick login event and handle response
  async function triggerSidekickLogin(user: any) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/sidekick/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ event: 'login', userId: user.id })
      });

      if (!res.ok) {
        throw new Error('Failed to get Sidekick response');
      }

      const data = await res.json();
      if (data.message) {
        // Use a unique toastId to prevent duplicates
        toast.info(data.message, { 
          icon: '🤖' as any,
          toastId: 'sidekick-greeting',
          position: 'top-right',
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        // If voice enabled, trigger TTS
        if (user.voiceSettings?.voice_enabled) {
          try {
            const ttsRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/voice/text-to-speech`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ text: data.message })
            });

            if (ttsRes.ok) {
              const audioBlob = await ttsRes.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              await audio.play();
              // Clean up the URL after playing
              URL.revokeObjectURL(audioUrl);
            } else {
              console.warn('TTS request failed:', await ttsRes.text());
            }
          } catch (ttsErr) {
            console.warn('TTS error:', ttsErr);
          }
        }
      }
    } catch (err) {
      console.error('Sidekick login event error:', err);
      // Show a fallback greeting if Sidekick fails
      toast.info(`Welcome back${user.name ? `, ${user.name}` : ''}!`, {
        icon: '👋' as any,
        toastId: 'fallback-greeting'
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        const errorMsg = !formData.email ? 'Email is required' : 'Password is required';
        setError(errorMsg);
        setIsLoading(false);
        return;
      }
      if (!isLogin && (!formData.name || !formData.confirmPassword)) {
        setError('Name and confirm password are required');
        setIsLoading(false);
        return;
      }
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      const endpoint = isLogin
        ? `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`
        : `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`;

      const body = isLogin
        ? {
            email: formData.email.trim(),
            password: formData.password,
          }
        : {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = data.error || (isLogin
          ? 'Login failed. Please check your credentials and try again.'
          : 'Registration failed. Please check your details and try again.');
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (!data.token && isLogin) {
        setError('Authentication error: No token received');
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        if (data.user && data.user.id) {
          try {
            await triggerSidekickLogin(data.user);
          } catch {}
        }
        window.location.href = '/dashboard';
      } else {
        toast.success('Registration successful! Please check your email to verify your account.');
        setIsLogin(true); // Switch to login mode after registration
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
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

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Get AI Avatar Icon
  const getAvatarIcon = (type: string) => {
    switch (type) {
      case 'orb': return <Brain className="w-full h-full" />;
      case 'assistant': return <Clock className="w-full h-full" />;
      case 'insight': return <MessageSquare className="w-full h-full" />;
      case 'helper': return <Calendar className="w-full h-full" />;
      default: return <Zap className="w-full h-full" />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-gradient-to-br from-black via-[#181818] to-[#0a0a0a] relative overflow-hidden">
      {/* Left: Glassy login/signup form card */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-12">
        <div className="w-full max-w-md bg-gradient-to-br from-[#181818]/90 to-[#2d1a00]/90 rounded-3xl shadow-2xl border border-[#FF6600]/30 backdrop-blur-xl p-8 md:p-10 flex flex-col gap-4" style={{ boxShadow: '0 0 32px 8px #FF660033, 0 0 64px 16px #fff1' }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#FF6600] drop-shadow-lg text-center">Boetos</h1>
          <p className="mb-3 text-base font-medium text-[#FF6600]/80 text-center">Your AI-powered productivity dimension.</p>
          <p className="mb-6 text-sm text-[#FF6600]/60 text-center">
            {isLogin ? (
              <>Don't have an account? <button className="text-[#FF6600] hover:underline font-semibold transition-all" type="button" onClick={toggleMode}>Create Account</button></>
            ) : (
              <>Already have an account? <button className="text-[#FF6600] hover:underline font-semibold transition-all" type="button" onClick={toggleMode}>Log In</button></>
            )}
          </p>
          {error && (
            <div className="mb-6 p-4 rounded-xl font-semibold bg-gradient-to-r from-[#FF6600]/10 to-[#FF6600]/10 text-[#FF6600] border border-[#FF6600]/30 backdrop-blur-sm animate-error-shake relative overflow-hidden">
              {error}
            </div>
          )}
          <button type="button" onClick={() => {window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/oauth/google`;}} className="w-full flex items-center justify-center gap-3 py-4 px-6 mb-8 font-semibold rounded-xl transition-all duration-300 border border-[#FF6600]/30 backdrop-blur-md hover:shadow-xl relative overflow-hidden group bg-white/10 text-[#FF6600] hover:bg-white/20">
            <span className="relative z-10">Continue with Google</span>
          </button>
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-[#FF6600]/30"></div>
            <span className="mx-4 text-xs px-3 py-1 rounded-full backdrop-blur-sm text-[#FF6600]/60 bg-black/20">or</span>
            <div className="flex-grow border-t border-[#FF6600]/30"></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium mb-2 text-[#FF6600]/80">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-4 border rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-[#FF6600]/50 focus:border-[#FF6600] placeholder-[#FF6600]/40 transition-all duration-300 bg-black/30 border-[#FF6600]/30 text-[#FF6600]" placeholder="Enter your name" required={!isLogin} />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-2 text-[#FF6600]/80">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-4 border rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-[#FF6600]/50 focus:border-[#FF6600] placeholder-[#FF6600]/40 transition-all duration-300 bg-black/30 border-[#FF6600]/30 text-[#FF6600]" placeholder="Enter your email address" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2 text-[#FF6600]/80">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-4 border rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-[#FF6600]/50 focus:border-[#FF6600] placeholder-[#FF6600]/40 pr-12 transition-all duration-300 bg-black/30 border-[#FF6600]/30 text-[#FF6600]" placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 hover:scale-110 text-[#FF6600]/60 hover:text-[#FF6600] hover:bg-[#FF6600]/10">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium mb-2 text-[#FF6600]/80">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="w-full px-4 py-4 border rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-[#FF6600]/50 focus:border-[#FF6600] placeholder-[#FF6600]/40 transition-all duration-300 bg-black/30 border-[#FF6600]/30 text-[#FF6600]" placeholder="Confirm your password" required={!isLogin} />
              </div>
            )}
            <button type="submit" className="w-full py-4 px-6 font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group hover:shadow-2xl bg-[#FF6600] text-white focus:ring-2 focus:ring-[#FF6600]/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? <span>Loading...</span> : <span>{isLogin ? 'Log In' : 'Create Account'}</span>}
            </button>
          </form>
          <p className="mt-8 text-xs text-center text-[#FF6600]/60">By continuing, you agree to our <a href="/privacy" className="text-[#FF6600] hover:underline font-semibold transition-all">Privacy Policy</a> and <a href="/terms" className="text-[#FF6600] hover:underline font-semibold transition-all">Terms of Service</a>.</p>
          <p className="mt-4 text-xs text-center text-[#FF6600]/40 opacity-80 animate-pulse-slow">You handle the ideas. Boetos handles the chaos.</p>
        </div>
      </div>
      {/* Right: Animated/AI elements */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-12">
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF6600]/60 to-[#FF6600]/40 blur-2xl animate-pulse"></div>
            <div className="relative w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-[#FF6600] to-[#FF6600] rounded-full flex items-center justify-center shadow-2xl">
              <Cpu className="w-16 h-16 md:w-20 md:h-20 text-white" style={{ filter: 'drop-shadow(0 0 16px #FF6600)' }} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#FF6600] mb-2 drop-shadow-lg text-center">Welcome to the Future</h2>
          <p className="text-base text-[#FF6600]/80 mb-4 text-center max-w-md">Step into Boetos — where AI meets productivity in perfect harmony.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#FF6600]/10 to-[#FF6600]/10 border border-[#FF6600]/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#FF6600]" />
                <span className="text-sm font-medium text-[#FF6600]/90">Today's Priorities</span>
              </div>
              <p className="text-xs text-[#FF6600]/70">AI-powered task optimization</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#FF6600]/10 to-[#FF6600]/10 border border-[#FF6600]/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-[#FF6600]" />
                <span className="text-sm font-medium text-[#FF6600]/90">Mental Clarity</span>
              </div>
              <p className="text-xs text-[#FF6600]/70">Burnout prevention & focus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
