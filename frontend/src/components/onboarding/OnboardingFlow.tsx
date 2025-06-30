import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { Brain, Calendar, Clock, Heart, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  questions: Array<{
    id: string;
    question: string;
    type: 'text' | 'number' | 'select' | 'multiselect';
    options?: string[];
  }>;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'work-patterns',
    title: 'Work Patterns',
    description: 'Help us understand your typical work schedule and preferences.',
    icon: <Clock className="w-6 h-6" />,
    questions: [
      {
        id: 'work-hours',
        question: 'What are your typical work hours?',
        type: 'text',
      },
      {
        id: 'meeting-preference',
        question: 'When do you prefer to schedule meetings?',
        type: 'select',
        options: ['Morning', 'Afternoon', 'Evening', 'Flexible'],
      },
      {
        id: 'focus-blocks',
        question: 'How many focus blocks do you need per day?',
        type: 'number',
      },
    ],
  },
  {
    id: 'wellness',
    title: 'Wellness & Health',
    description: 'Tell us about your wellness goals and health preferences.',
    icon: <Heart className="w-6 h-6" />,
    questions: [
      {
        id: 'stress-level',
        question: 'How would you rate your current stress level? (1-10)',
        type: 'number',
      },
      {
        id: 'wellness-activities',
        question: 'What wellness activities do you practice?',
        type: 'multiselect',
        options: ['Meditation', 'Exercise', 'Yoga', 'Reading', 'Walking', 'Other'],
      },
      {
        id: 'break-preferences',
        question: 'How often do you need breaks during work?',
        type: 'select',
        options: ['Every 30 minutes', 'Every hour', 'Every 2 hours', 'Flexible'],
      },
    ],
  },
  {
    id: 'productivity',
    title: 'Productivity Goals',
    description: 'Help us understand your productivity goals and challenges.',
    icon: <Brain className="w-6 h-6" />,
    questions: [
      {
        id: 'productivity-challenges',
        question: 'What are your main productivity challenges?',
        type: 'multiselect',
        options: ['Distractions', 'Time Management', 'Focus', 'Energy Levels', 'Other'],
      },
      {
        id: 'productivity-goals',
        question: 'What are your main productivity goals?',
        type: 'text',
      },
      {
        id: 'preferred-tools',
        question: 'What productivity tools do you use?',
        type: 'multiselect',
        options: ['Calendar', 'Task Manager', 'Note Taking', 'Time Tracking', 'Other'],
      },
    ],
  },
];

interface OnboardingFlowProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const { user } = useUser();

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          {currentStepData.icon}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {currentStepData.description}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {currentStepData.questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {question.question}
              </label>
              {question.type === 'text' && (
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              )}
              {question.type === 'number' && (
                <input
                  type="number"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswer(question.id, parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              )}
              {question.type === 'select' && (
                <select
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select an option</option>
                  {question.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              {question.type === 'multiselect' && (
                <div className="space-y-2">
                  {question.options?.map((option) => (
                    <label key={option} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={answers[question.id]?.includes(option) || false}
                        onChange={(e) => {
                          const currentAnswers = answers[question.id] || [];
                          const newAnswers = e.target.checked
                            ? [...currentAnswers, option]
                            : currentAnswers.filter((a: string) => a !== option);
                          handleAnswer(question.id, newAnswers);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-8 gap-2">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <button
            onClick={onCancel}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {currentStep === onboardingSteps.length - 1 ? 'Complete' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}; 