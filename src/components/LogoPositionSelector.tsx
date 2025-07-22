'use client';

import { useState, useEffect } from 'react';
import { LogoPosition } from '@/types';
import { MapPin } from 'lucide-react';

interface LogoPositionSelectorProps {
  selectedPosition: LogoPosition;
  onPositionChange: (position: LogoPosition) => void;
}

const POSITION_OPTIONS: { value: LogoPosition; label: string; description: string }[] = [
  { value: 'center', label: 'Center', description: 'Centered on the front' },
  { value: 'left-chest', label: 'Left Chest', description: 'Small logo on left chest' },
  { value: 'right-chest', label: 'Right Chest', description: 'Small logo on right chest' },
  { value: 'top-left', label: 'Top Left', description: 'Logo in top left corner' },
  { value: 'top-right', label: 'Top Right', description: 'Logo in top right corner' },
  { value: 'bottom-left', label: 'Bottom Left', description: 'Logo in bottom left corner' },
  { value: 'bottom-right', label: 'Bottom Right', description: 'Logo in bottom right corner' }
];

export default function LogoPositionSelector({ selectedPosition, onPositionChange }: LogoPositionSelectorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Logo Position *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 border border-gray-300 rounded-lg animate-pulse">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Logo Position *
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {POSITION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onPositionChange(option.value)}
            className={`p-3 border rounded-lg text-left transition-colors ${
              selectedPosition === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <div>
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-black">{option.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 