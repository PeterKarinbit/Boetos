import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Settings, Zap, Calendar, Heart, MessageCircle } from 'lucide-react';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [commandHistory, setCommandHistory] = useState([
    { command: "How am I feeling today?", response: "Based on your recent check-ins, you're feeling moderately stressed. Would you like some relaxation suggestions?", timestamp: "10:30 AM" },
    { command: "Schedule yoga session", response: "I've added a 45-minute yoga session to your calendar for tomorrow at 7 AM. Should I set a reminder?", timestamp: "9:15 AM" },
    { command: "What's my burnout risk?", response: "Your current burnout risk is moderate. I recommend taking more breaks and getting better sleep.", timestamp: "Yesterday" },
  ]);
  const [audioLevel, setAudioLevel] = useState(0);

  const quickCommands = [
    { icon: Heart, text: "Check my wellness", command: "How am I feeling today?" },
    { icon: Calendar, text: "Schedule break", command: "Schedule a 15-minute break" },
    { icon: Zap, text: "Energy boost tips", command: "Give me energy boosting suggestions" },
    { icon: MessageCircle, text: "Mood check-in", command: "I want to log my current mood" },
  ];

  // Simulate audio levels during listening
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const startListening = () => {
    setIsListening(true);
    setTranscript('');
    setResponse('');
    // Simulate voice recognition
    setTimeout(() => {
      setTranscript("How can I reduce my stress levels?");
      setIsListening(false);
      setIsProcessing(true);
      
      setTimeout(() => {
        setResponse("I suggest trying deep breathing exercises, taking a 10-minute walk, or scheduling a short meditation break. Would you like me to add any of these to your calendar?");
        setIsProcessing(false);
        
        // Add to history
        setCommandHistory(prev => [{
          command: "How can I reduce my stress levels?",
          response: "I suggest trying deep breathing exercises, taking a 10-minute walk, or scheduling a short meditation break.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }, ...prev]);
      }, 2000);
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
    setIsProcessing(false);
  };

  const executeQuickCommand = (command: React.SetStateAction<string> | string[]) => {
    setTranscript(command);
    setIsProcessing(true);
    
    // Simulate processing and response
    setTimeout(() => {
      let simulatedResponse = "I'm processing your request...";
      
      if (command.includes("wellness") || command.includes("feeling")) {
        simulatedResponse = "Your wellness score today is 7/10. You've been doing well with your breaks but could improve your sleep schedule.";
      } else if (command.includes("break")) {
        simulatedResponse = "I've scheduled a 15-minute wellness break for you in 30 minutes. I'll send you a gentle reminder.";
      } else if (command.includes("energy")) {
        simulatedResponse = "Try these energy boosters: drink water, do 5 jumping jacks, step outside for fresh air, or have a healthy snack.";
      } else if (command.includes("mood")) {
        simulatedResponse = "Let's do a quick mood check-in. On a scale of 1-10, how are you feeling right now?";
      }
      
      setResponse(simulatedResponse);
      setIsProcessing(false);
      
      setCommandHistory(prev => [{
        command,
        response: simulatedResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev]);
    }, 1500);
  };

  const WaveformVisualization = () => (
    <div className="flex items-center justify-center space-x-1 h-12">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="bg-blue-500 rounded-full transition-all duration-150"
          style={{
            width: '3px',
            height: isListening ? `${Math.random() * 40 + 10}px` : '4px',
            opacity: isListening ? 0.3 + (audioLevel / 100) * 0.7 : 0.3
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-blue-500 rounded-full">
              <Mic className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Voice Assistant</h1>
          </div>
          <p className="text-gray-600 max-w-xs sm:max-w-2xl mx-auto text-sm sm:text-base">
            Your AI-powered wellness companion. Speak naturally to manage your calendar, 
            track your mood, and get personalized wellness recommendations.
          </p>
        </div>

        {/* Main Voice Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-6 sm:mb-8 w-full">
          {/* Voice Button */}
          <div className="text-center mb-6 sm:mb-8">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200 shadow-2xl' 
                  : isProcessing
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200 shadow-xl'
              }`}
            >
              {isListening ? (
                <MicOff className="h-10 w-10 sm:h-12 sm:w-12 text-white absolute inset-0 m-auto" />
              ) : (
                <Mic className="h-10 w-10 sm:h-12 sm:w-12 text-white absolute inset-0 m-auto" />
              )}
              {/* Pulse animation for listening state */}
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
                  <div className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-50"></div>
                </>
              )}
            </button>
            <div className="mt-3 sm:mt-4">
              <p className="text-base sm:text-lg font-medium text-gray-700">
                {isListening ? "Listening..." : isProcessing ? "Processing..." : "Tap to speak"}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {isListening ? "I'm ready to help with your wellness needs" : 
                 isProcessing ? "Understanding your request..." : 
                 "Ask me about your schedule, mood, or wellness tips"}
              </p>
            </div>
          </div>

          {/* Waveform Visualization */}
          {(isListening || isProcessing) && (
            <div className="mb-6 sm:mb-8">
              <WaveformVisualization />
            </div>
          )}

          {/* Current Transcript */}
          {transcript && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="font-medium text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">You said:</h3>
              <p className="text-gray-900 text-sm sm:text-base">{transcript}</p>
            </div>
          )}

          {/* Current Response */}
          {response && (
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-700 mb-1 sm:mb-2 text-sm sm:text-base">Assistant:</h3>
                  <p className="text-blue-900 text-sm sm:text-base">{response}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Commands */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">Quick Commands</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => executeQuickCommand(cmd.command)}
                className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-lg p-2 sm:p-4 text-xs sm:text-sm text-blue-700 font-medium"
              >
                <cmd.icon className="h-5 w-5 mb-1" />
                {cmd.text}
              </button>
            ))}
          </div>
        </div>

        {/* Command History */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full mb-6 sm:mb-8 overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Command History</h2>
          <div className="space-y-2">
            {commandHistory.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 border-b border-gray-100 pb-2 last:border-b-0">
                <span className="font-semibold text-xs sm:text-sm text-gray-700">{item.command}</span>
                <span className="text-xs sm:text-sm text-gray-500">{item.response}</span>
                <span className="text-xs text-gray-400 ml-auto">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-3">💡 Voice Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">Calendar Management:</p>
              <p className="opacity-90">"Schedule a meeting tomorrow at 3 PM"</p>
            </div>
            <div>
              <p className="font-medium mb-1">Wellness Tracking:</p>
              <p className="opacity-90">"I'm feeling stressed, what should I do?"</p>
            </div>
            <div>
              <p className="font-medium mb-1">Mood Logging:</p>
              <p className="opacity-90">"Log my mood as happy today"</p>
            </div>
            <div>
              <p className="font-medium mb-1">Quick Actions:</p>
              <p className="opacity-90">"Remind me to take a break in 1 hour"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;