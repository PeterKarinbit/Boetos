import { Mic, VolumeX, Loader2 } from 'lucide-react';

interface VoiceCommandIndicatorProps {
  isListening: boolean;
  isProcessing: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceCommandIndicator({
  isListening,
  isProcessing,
  onStart,
  onStop,
  className = '',
  size = 'md',
}: VoiceCommandIndicatorProps) {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = () => {
    if (isListening) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
        className={`relative rounded-full transition-all duration-300 flex items-center justify-center ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
        } ${sizeClasses[size]} ${
          isProcessing ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105 transform'
        }`}
        aria-label={isListening ? 'Stop listening' : 'Start voice command'}
        aria-busy={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : isListening ? (
          <VolumeX className={iconSizes[size]} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </button>
      
      {/* Animated pulse effect when listening */}
      {isListening && (
        <div className="absolute inset-0 rounded-full bg-red-500/40 animate-ping opacity-75" />
      )}
      
      {/* Tooltip */}
      <div 
        className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${
          isListening ? 'opacity-100' : ''
        }`}
      >
        {isListening ? 'Listening...' : 'Click to speak'}
      </div>
    </div>
  );
};

export default VoiceCommandIndicator;