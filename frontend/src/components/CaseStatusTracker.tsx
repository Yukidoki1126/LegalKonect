import React from 'react';

interface StatusTrackerProps {
  status: 'pending' | 'ongoing' | 'closed';
}

const CaseStatusTracker: React.FC<StatusTrackerProps> = ({ status }) => {
  const stages = [
    { key: 'pending', label: 'Pending Review', icon: '📋' },
    { key: 'ongoing', label: 'In Progress', icon: '⚖️' },
    { key: 'closed', label: 'Resolved', icon: '✅' },
  ];

  const getStageIndex = (statusKey: string) => {
    return stages.findIndex((s) => s.key === statusKey);
  };

  const currentIndex = getStageIndex(status);

  return (
    <div className="w-full py-6">
      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background Line */}
        <div className="absolute top-8 left-0 w-full h-1 bg-gray-200"></div>

        {/* Progress Line */}
        <div
          className="absolute top-8 left-0 h-1 bg-blue-600 transition-all duration-500"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
        ></div>

        {/* Status Stages */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={stage.key} className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-2xl
                    border-4 transition-all duration-300 z-10 bg-white
                    ${
                      isCompleted
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : isCurrent
                        ? 'border-blue-600 bg-white animate-pulse'
                        : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {stage.icon}
                </div>

                {/* Label */}
                <div className="mt-3 text-center">
                  <p
                    className={`
                      text-sm font-semibold
                      ${
                        isCompleted || isCurrent
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-gray-500 mt-1">Current Status</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Description */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">
            {stages[currentIndex].icon}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              {stages[currentIndex].label}
            </h4>
            <p className="text-xs text-blue-700">
              {status === 'pending' &&
                'Your case has been created and is pending review.'}
              {status === 'ongoing' &&
                'Your case is ongoing. Your lawyer is actively working on it.'}
              {status === 'closed' &&
                'Your case has been closed. You can view the resolution summary below.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseStatusTracker;
