import { Files, CheckCircle, Clock, Play } from 'lucide-react';
import { Step } from '../types';
import { motion } from 'framer-motion';

interface StepsListProps {
  steps: Step[];
  currentStep: Step | null;
  onStepClick: (step: Step) => void;
}

interface StepNodeProps {
  item: Step;
  depth: number;
  onStepClick: (step: Step) => void;
  index: number;
}

function StepNode({ item, depth, onStepClick, index }: StepNodeProps) {
  const handleClick = () => {
    onStepClick(item);
  };

  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Play className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-sm flex-shrink-0 ${getStatusColor()}`}
      style={{ marginLeft: `${depth * 1}rem` }}
      onClick={handleClick}
    >
      {getStatusIcon()}
      <span className="text-sm font-medium flex-1">{item.title}</span>
    </motion.div>
  );
}

export function StepsList({ steps, onStepClick }: StepsListProps) {
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-black rounded-xl">
            <Files className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-black text-lg">Build Steps</h2>
            <p className="text-gray-500 text-sm">
              {completedSteps} of {totalSteps} completed
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div 
            className="bg-black h-2 rounded-full transition-all duration-500"
            initial={{ width: 0 }}
            animate={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Steps List - Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6">
          <div className="space-y-3">
            {steps.length > 0 ? (
              steps.map((step, index) => (
                <StepNode
                  key={step.id}
                  item={step}
                  depth={0}
                  onStepClick={onStepClick}
                  index={index}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Files className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">
                  Steps will appear here as AI builds your app
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}