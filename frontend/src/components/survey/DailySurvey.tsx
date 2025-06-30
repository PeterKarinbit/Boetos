import React, { useState } from 'react';
import { Heart, Brain, Clock, MessageSquare, X } from 'lucide-react';

interface DailySurveyProps {
  isOpen: boolean;
  onSubmit: (data: DailySurveyData) => void;
  onClose: () => void;
}

export interface DailySurveyData {
  mood: number;
  stress: number;
  sleep: number;
  energy: number;
  notes: string;
  nudgePreference: string;
}

const moods = [
  'Great',
  'Good',
  'Neutral',
  'Tired',
  'Stressed',
  'Overwhelmed'
];

const nudgeOptions = [
  { value: 'daily', label: 'Remind daily' },
  { value: 'before_sleep', label: 'Remind before sleep' },
  { value: 'never', label: "Don't remind" },
];

// Map moods to numbers
const moodMap: Record<string, number> = {
  'Great': 6,
  'Good': 5,
  'Neutral': 4,
  'Tired': 3,
  'Stressed': 2,
  'Overwhelmed': 1,
};

export const DailySurvey: React.FC<DailySurveyProps> = ({ isOpen, onSubmit, onClose }) => {
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [nudgePreference, setNudgePreference] = useState('daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mood) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    onSubmit({
      mood: moodMap[mood], // send as number
      stress,
      sleep,
      energy,
      notes,
      nudgePreference
    });
  };

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStress(5);
      setSleep(5);
      setEnergy(5);
      setMood('');
      setNotes('');
      setShowValidation(false);
      setNudgePreference('daily');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Check-in</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How stressed do you feel today? (1-10)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={stress}
                onChange={(e) => setStress(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {stress}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How well did you sleep last night? (1-10)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={sleep}
                onChange={(e) => setSleep(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {sleep}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How much energy did you have today? (1-10)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {energy}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How's your mood today?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {moods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                    mood === m
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Any notes or thoughts for today?
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              placeholder="Share your thoughts..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              When would you like to be nudged or reminded?
            </label>
            <div className="flex gap-3">
              {nudgeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setNudgePreference(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    nudgePreference === option.value
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!mood}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${!mood ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Submit
            </button>
          </div>
          {showValidation && !mood && (
            <div className="text-red-500 text-sm mt-2">Please select your mood before submitting.</div>
          )}
        </form>
      </div>
    </div>
  );
}; 