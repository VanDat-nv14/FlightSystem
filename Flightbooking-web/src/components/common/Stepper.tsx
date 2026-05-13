import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  name: string;
  status: 'upcoming' | 'current' | 'complete';
}

interface StepperProps {
  steps: Step[];
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, className }) => {
  return (
    <nav aria-label="Progress" className={cn("py-4", className)}>
      <ol role="list" className="flex items-center justify-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={cn(stepIdx !== steps.length - 1 ? 'flex-1' : '', 'relative')}>
            {step.status === 'complete' ? (
              <div className="group flex flex-col items-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="mt-2 text-xs font-medium text-primary">{step.name}</span>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-0.5 bg-primary -z-10" />
                )}
              </div>
            ) : step.status === 'current' ? (
              <div className="flex flex-col items-center" aria-current="step">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <span className="mt-2 text-xs font-medium text-primary">{step.name}</span>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200 -z-10" />
                )}
              </div>
            ) : (
              <div className="group flex flex-col items-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                </span>
                <span className="mt-2 text-xs font-medium text-gray-500 group-hover:text-gray-700">{step.name}</span>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200 -z-10" />
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
