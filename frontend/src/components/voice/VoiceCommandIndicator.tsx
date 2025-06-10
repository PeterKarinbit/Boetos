import React, { useState, useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface VoiceCommandIndicatorProps {
  onClose: () => void;
}

const VoiceCommandIndicator: React.FC<VoiceCommandIndicatorProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(true);
  
  useEffect(() => {
    let recognition: SpeechRecognition | null = null;
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
        
        // Process commands here
        const command = transcriptText.toLowerCase().trim();
        if (command.includes('schedule') || command.includes('meeting')) {
          // Handle schedule command
          console.log('Schedule command detected');
        } else if (command.includes('focus') || command.includes('do not disturb')) {
          // Handle focus mode command
          console.log('Focus mode command detected');
        } else if (command.includes('help') || command.includes('overwhelmed')) {
          // Handle help command
          console.log('Help command detected');
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser.');
      onClose();
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [onClose]);
  
  return (
    <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 w-96 max-w-full mx-4 rounded-lg shadow-lg z-50 ${
      theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
    }`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Voice Command</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close voice command"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-center mb-4">
          <div className={`p-4 rounded-full ${isListening ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <Mic className={`h-6 w-6 ${isListening ? 'text-blue-600 dark:text-blue-400 animate-pulse' : 'text-gray-500 dark:text-gray-400'}`} />
          </div>
        </div>
        
        <div className={`min-h-16 p-3 rounded-md mb-3 text-center ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          {transcript ? (
            <p>{transcript}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Say "Hey Boetos" followed by your command...</p>
          )}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Try commands like:</p>
          <ul className="mt-1 space-y-1">
            <li>"Schedule a meeting with John tomorrow at 2 PM"</li>
            <li>"Enable focus mode for 30 minutes"</li>
            <li>"I'm feeling overwhelmed, help me prioritize"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VoiceCommandIndicator;