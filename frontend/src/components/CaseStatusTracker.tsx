import React from 'react';

interface StatusTrackerProps {
  status: 'pending' | 'ongoing' | 'closed';
}

const CaseStatusTracker: React.FC<StatusTrackerProps> = ({ status }) => {
  const stages = [
    { key: 'pending', label: 'Pending' },
    { key: 'ongoing', label: 'In Progress' },
    { key: 'closed', label: 'Resolved' },
  ];

  const getStageIndex = (statusKey: string) => {
    return stages.findIndex((s) => s.key === statusKey);
  };

  const currentIndex = getStageIndex(status);

  return (
    <div className="w-full">
      {/* Progress Steps */}
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-200"></div>

        {/* Progress Line */}
        <div
          className="absolute top-3 left-0 h-0.5 bg-blue-600 transition-all"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        ></div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={stage.key} className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs
                    border-2 bg-white z-10 transition-colors
                    ${isCompleted ? 'border-blue-600 bg-blue-600 text-white' : ''}
                    ${isCurrent ? 'border-blue-600' : ''}
                    ${!isCompleted && !isCurrent ? 'border-gray-300' : ''}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={isCurrent ? 'text-blue-600' : 'text-gray-400'}>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <p className={`mt-2 text-xs font-medium ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CaseStatusTracker;
