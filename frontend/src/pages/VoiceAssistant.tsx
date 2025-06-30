import React from "react";
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Calendar, BookOpen, PlusCircle, RefreshCw, Brain, Mic, Send, Sparkles, MoreVertical, Volume2, BarChart3, Target, Activity as LucideActivity, Award, Zap, ShieldCheck, Clock, Trash2 } from 'lucide-react';

// Import type definitions
import '../types/speech.d';
import { useMemoryEntries } from '../hooks/useMemoryEntries';
import api from '../services/api';
import { getChatMessages, postChatMessage, deleteChatMessage, deleteAllChatMessages, getChatSessions } from '../services/api';
import MemoryArea from '../components/memory/MemoryArea';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Types
interface MemoryEntry {
  id: string | number;
  content: string;
  type: string;
  nudgePreference?: string;
  snoozedUntil?: string | Date;
  sender?: 'user' | 'assistant';
  time?: string;
}

// ChatEntry type for assistant/user chat messages
type ChatEntry = {
  id: string | number;
  content: string;
  sender: 'user' | 'assistant';
  type?: string;
  time?: string;
};

// Add session state
interface ChatSession {
  session_id: string;
  first_message: string;
  first_message_time: string;
  last_message_time: string;
}

// Enhanced Spinner component with dashboard styling
const Spinner: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

// Enhanced Voice Command Indicator component
interface VoiceCommandIndicatorProps {
  isListening: boolean;
  isProcessing: boolean;
  onStart: () => void;
  onStop: () => void;
}

const VoiceCommandIndicator: React.FC<VoiceCommandIndicatorProps> = ({ isListening, isProcessing, onStart, onStop }) => (
  <button
    type="button"
    onClick={isListening ? onStop : onStart}
    className={`relative p-4 rounded-full transition-all duration-300 transform hover:scale-105 ${
      isListening 
        ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30 animate-pulse' 
        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/30'
    }`}
  >
    <Mic className={`h-6 w-6 text-white ${isListening ? 'animate-bounce' : ''}`} />
    {isListening && (
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-400 to-pink-400 opacity-75 animate-ping"></div>
    )}
  </button>
);

// Enhanced Action Quick-Buttons with dashboard styling
const quickActions = [
  { 
    icon: <Calendar className="h-5 w-5" />, 
    label: 'Calendar', 
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/30'
  },
  { 
    icon: <BookOpen className="h-5 w-5" />, 
    label: 'Memory', 
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/30'
  },
  { 
    icon: <PlusCircle className="h-5 w-5" />, 
    label: 'New Task', 
    gradient: 'from-orange-500 to-red-500',
    shadow: 'shadow-orange-500/30'
  }
];

const nudgeOptions = [
  { value: 'daily', label: 'Remind daily' },
  { value: 'before_sleep', label: 'Remind before sleep' },
  { value: 'never', label: "Don't remind" },
];

const typeOptions = [
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'reminder', label: 'Reminder' },
];

// New Task Modal State
type NewTask = { title: string; time: string; venue: string };

export default function VoiceAssistant() {
  // --- State ---
  const [content, setContent] = useState<string>('');
  const [type, setType] = useState<string>('note');
  const [nudgePreference, setNudgePreference] = useState<string>('daily');
  const [expandedEntryId, setExpandedEntryId] = useState<string | number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    setError
  } = useMemoryEntries();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState<NewTask>({ title: '', time: '', venue: '' });
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [chatMenuOpen, setChatMenuOpen] = useState<string | null>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Fetch chat sessions and messages
  React.useEffect(() => {
    (async () => {
      setIsLoadingSessions(true);
      try {
        const sessions = await getChatSessions();
        setChatSessions(sessions);
        if (sessions.length > 0) {
          setSelectedSessionId(sessions[0].session_id);
        } else {
          // If no sessions, create a new one and select it
          const newSessionId = crypto.randomUUID();
          setSelectedSessionId(newSessionId);
          setChatSessions([{
            session_id: newSessionId,
            first_message: '',
            first_message_time: new Date().toISOString(),
            last_message_time: new Date().toISOString(),
          }]);
        }
      } catch (err) {
        console.error('Error loading chat sessions:', err);
        // Create a new session if loading fails
        const newSessionId = crypto.randomUUID();
        setSelectedSessionId(newSessionId);
        setChatSessions([{
          session_id: newSessionId,
          first_message: '',
          first_message_time: new Date().toISOString(),
          last_message_time: new Date().toISOString(),
        }]);
      } finally {
        setIsLoadingSessions(false);
      }
    })();
  }, []);

  // Fetch messages for the selected session
  React.useEffect(() => {
    if (!selectedSessionId) return;
    (async () => {
      setIsLoadingMessages(true);
      try {
        const messages = await getChatMessages(selectedSessionId);
        setChatEntries(messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          time: msg.created_at,
        })));
      } catch (err) {
        console.error('Error loading chat messages:', err);
        setChatEntries([]);
      } finally {
        setIsLoadingMessages(false);
      }
    })();
  }, [selectedSessionId]);

  // Send a new chat message (user or assistant)
  const sendChatMessage = async (content: string, sender: 'user' | 'assistant') => {
    if (!selectedSessionId) return;
    const newMsg = await postChatMessage({ content, sender, session_id: selectedSessionId });
    setChatEntries(prev => ([...prev, {
      id: newMsg.id,
      content: newMsg.content,
      sender: newMsg.sender,
      time: newMsg.created_at,
    }]));
  };

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries]);

  const handleSendChat = async (messageContent?: string) => {
    const contentToSend = messageContent || content;
    if (!contentToSend.trim() || !selectedSessionId) {
      toast.error('Please enter a message.');
      return;
    }

    setAiLoading(true);

    try {
      await sendChatMessage(contentToSend, 'user');
      if (!messageContent) setContent('');

      // Use correct API endpoint
      const res = await api.post('/api/voice/process', { prompt: contentToSend });

      if (res.data?.error) throw new Error(res.data.error);

      const responseText = res.data.text || "I'm sorry, I couldn't generate a response.";
      await sendChatMessage(responseText, 'assistant');

      if (res.data.audioUrl) {
        setLastAudioUrl(res.data.audioUrl);
        try {
          if (audioRef.current) {
            audioRef.current.src = res.data.audioUrl;
            await audioRef.current.play();
          }
        } catch (audioError) {
          speakText(responseText);
        }
      } else {
        speakText(responseText);
      }
    } catch (error: any) {
      setLastAudioUrl(null);
      let errorMessage = 'Failed to get AI response. ';
      if (error.response?.status === 401) {
        errorMessage += 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 429) {
        errorMessage += 'Rate limit exceeded. Please try again later.';
      } else if (error.response?.status >= 500) {
        errorMessage += 'Server error. Please try again later.';
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      }
      await sendChatMessage("I'm sorry, I'm having trouble connecting to the AI service. Please try again in a moment.", 'assistant');
      toast.error(errorMessage);
    } finally {
      setAiLoading(false);
    }
  };
  
  // Text-to-speech function using Web Speech API
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.warning('Text-to-speech is not supported in this browser');
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create a new utterance
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a good English voice
      const englishVoices = voices.filter(voice => 
        voice.lang.toLowerCase().includes('en')
      );
      
      // Prefer female voices if available
      const preferredVoices = englishVoices.filter(voice => 
        voice.name.toLowerCase().includes('female')
      );
      
      // Use preferred voice or fall back to first English voice
      if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
      } else if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }
      
      // Set up event handlers
      utterance.onstart = () => {
        console.log('Speech synthesis started');
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log('Speech synthesis ended');
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event: Event) => {
        const errorEvent = event as SpeechSynthesisErrorEvent;
        console.error('Speech synthesis error:', errorEvent.error);
        setIsSpeaking(false);
        toast.error(`Speech synthesis error: ${errorEvent.error}`);
      };
      
      // Start speaking
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Error in speakText:', error);
      toast.error('Failed to initialize speech synthesis');
    }
  };

  const handleUpdate = async (id: string | number, updates: Partial<MemoryEntry>) => {
    try {
      await updateEntry(id, updates);
    } catch (err) {
      if (setError) setError('Failed to update entry.');
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await deleteEntry(id);
    } catch (err) {
      if (setError) setError('Failed to delete entry.');
    }
  };

  // Add proper chat message deletion function
  const handleDeleteChatMessage = async (id: string | number) => {
    try {
      await deleteChatMessage(String(id));
      // Remove from local state
      setChatEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (err) {
      console.error('Failed to delete chat message:', err);
      // You could add a notification here if you have a notification system
    }
  };

  // Delete all chat messages function
  const handleDeleteAllChatMessages = async () => {
    if (chatEntries.length === 0) return;
    
    if (window.confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
      try {
        await deleteAllChatMessages();
        // Clear local state
        setChatEntries([]);
        setChatMenuOpen(null);
      } catch (err) {
        console.error('Failed to delete all chat messages:', err);
        // You could add a notification here if you have a notification system
      }
    }
  };

  const handleQuickAction = async (label: string) => {
    // Show coming soon modal for all quick actions
    setShowComingSoonModal(true);
  };

  const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleNewTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    try {
      await addEntry({
        content: `Task: ${newTask.title}${newTask.time ? ` at ${newTask.time}` : ''}${newTask.venue ? ` at ${newTask.venue}` : ''}`,
        type: 'reminder',
        nudgePreference: 'daily'
      });
      setNewTask({ title: '', time: '', venue: '' });
      setShowNewTaskModal(false);
    } catch (err) {
      if (setError) setError('Failed to create task.');
    }
  };

  const recognitionRef = useRef<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.warn('Speech recognition not supported in this browser');
          return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          try {
            const transcript = event.results[0][0].transcript;
            setContent(transcript);
            handleSendChat(transcript);
          } catch (error) {
            console.error('Error processing speech recognition result:', error);
            toast.error('Error processing voice input');
          }
        };

        recognition.onerror = (event: Event) => {
          const errorEvent = event as any;
          console.error('Speech recognition error:', errorEvent.error, errorEvent.message);
          toast.error(`Speech recognition error: ${errorEvent.error}`);
          setIsListening(false);
          setIsProcessing(false);
        };

        recognition.onend = () => {
          if (isListening) {
            console.log('Speech recognition ended');
            setIsListening(false);
            setIsProcessing(false);
          }
        };

        recognitionRef.current = recognition;
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        toast.error('Failed to initialize speech recognition');
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }
    };
  }, [isListening]);

  const handleStartListening = () => {
    if (recognitionRef.current) {
      try {
        setContent('');
        setIsListening(true);
        setIsProcessing(true);
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Error starting speech recognition');
        setIsListening(false);
        setIsProcessing(false);
      }
    } else {
      toast.error('Speech recognition not supported in this browser');
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    setIsListening(false);
    setIsProcessing(false);
  };

  // Enhanced Animated Background with dashboard styling
  const AnimatedBg = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      
      {/* Animated blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      
      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full opacity-60 animate-ping"></div>
      <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400 rounded-full opacity-40 animate-pulse"></div>
      <div className="absolute bottom-1/4 left-3/4 w-1 h-1 bg-pink-400 rounded-full opacity-80 animate-bounce"></div>
    </div>
  );

  // Add a repeat button to replay the last assistant message's audio
  const handleRepeatAudio = () => {
    if (lastAudioUrl && audioRef.current) {
      audioRef.current.src = lastAudioUrl;
      audioRef.current.play();
    }
  };

  // Start a new chat session
  const handleNewChat = () => {
    // Generate a new session_id (UUID v4)
    const newSessionId = crypto.randomUUID();
    setSelectedSessionId(newSessionId);
    setChatEntries([]);
    // Optionally, add the new session to the list immediately
    setChatSessions(prev => [
      {
        session_id: newSessionId,
        first_message: '',
        first_message_time: new Date().toISOString(),
        last_message_time: new Date().toISOString(),
      },
      ...prev
    ]);
  };

  // Clear all chat messages for current session
  const handleClearChat = async () => {
    if (!selectedSessionId || chatEntries.length === 0) return;
    
    if (window.confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
      try {
        await deleteAllChatMessages();
        setChatEntries([]);
        toast.success('Chat cleared successfully');
      } catch (err) {
        console.error('Failed to clear chat messages:', err);
        toast.error('Failed to clear chat messages');
      }
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AnimatedBg />
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header Section - Matching Dashboard style */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">
              Voice Assistant
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Your intelligent AI companion for productivity and task management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500">
              <Brain className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Main Content Grid - Using 12-column grid system like Dashboard */}
        <div className="grid grid-cols-12 gap-6">
          {/* AI Assistant Area - Spans 8 columns on large screens */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Enhanced Chat Container - Now the main focus with seamless design */}
            <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-8 transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                    <Brain className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Boetos AI Assistant</h3>
                    <p className="text-slate-600 dark:text-slate-400">Ready to help with your tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {chatEntries.length > 0 && (
                    <button
                      onClick={handleClearChat}
                      className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 hover:text-red-400 transition-colors"
                      title="Clear Chat"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                  <VoiceCommandIndicator
                    isListening={isListening}
                    isProcessing={isProcessing}
                    onStart={handleStartListening}
                    onStop={handleStopListening}
                  />
                </div>
              </div>

              {/* Chat Messages - Made larger with seamless design */}
              <div className="bg-slate-700/40 rounded-3xl p-8 mb-8" style={{ minHeight: '550px', maxHeight: '650px', overflowY: 'auto' }}>
                {error && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                    {error}
                  </div>
                )}
                {(loading || isLoadingSessions || isLoadingMessages) && <Spinner />}
                {!loading && !isLoadingSessions && !isLoadingMessages && chatEntries.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation with your AI assistant</p>
                  </div>
                )}
                {chatEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-end gap-4 mb-6 group ${entry.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {entry.sender === 'assistant' && (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`relative max-w-[75%] rounded-3xl px-6 py-4 text-sm leading-relaxed shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl
                        ${entry.sender === 'assistant'
                          ? 'bg-slate-600/40 text-slate-100 rounded-bl-md border border-slate-500/30'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md shadow-blue-500/30'
                        }`}
                    >
                      {/* Delete button - only show on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChatMessage(entry.id);
                        }}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 shadow-md"
                        title="Delete message"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      
                      {entry.content}
                      <div className="text-xs text-slate-400 mt-3 text-right">
                        {entry.time && new Date(entry.time).toLocaleTimeString()}
                      </div>
                    </div>
                    {entry.sender === 'user' && (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 flex items-center justify-center shadow-lg text-white font-bold text-sm">
                        U
                      </div>
                    )}
                    {entry.sender === 'assistant' && lastAudioUrl && chatEntries[chatEntries.length - 1]?.id === entry.id && (
                      <button 
                        onClick={handleRepeatAudio} 
                        className="ml-2 text-blue-400 hover:text-blue-300 transition-colors" 
                        title="Play Voice Reply"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                {aiLoading && <Spinner />}
                <div ref={messagesEndRef} />
              </div>

              {/* Enhanced Input Area */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-slate-700/50 backdrop-blur-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-600/30 transition-all duration-300 text-base"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Ask me anything or use quick actions..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  />
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                    <Sparkles className="h-5 w-5 text-blue-400 opacity-50" />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleSendChat()}
                  disabled={!content.trim() || !selectedSessionId || aiLoading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center gap-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                  Send
                </button>
              </div>
            </div>

            {/* Enhanced Quick Actions - Now below the chat with seamless design */}
            <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-8 transition-all duration-300">
              <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={action.label}
                    className={`
                      flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r ${action.gradient} text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${action.shadow} hover:shadow-xl
                    `}
                    onClick={() => handleQuickAction(action.label)}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Memory Area - Spans 4 columns on large screens */}
          <div className="col-span-12 lg:col-span-4 min-w-0">
            <div className="bg-white/30 dark:bg-slate-800/40 backdrop-blur-sm rounded-3xl p-8 transition-all duration-300 w-full max-w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Memory & Notes</h3>
                <button
                  onClick={() => setShowMemory(!showMemory)}
                  className="p-2 rounded-full bg-slate-600/30 hover:bg-slate-500/40 transition-colors"
                >
                  {showMemory ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              </div>
              {showMemory && (
                <div className="w-full max-w-full overflow-x-auto">
                  <MemoryArea />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for playing voice responses */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
} 