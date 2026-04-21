import { useState } from 'react';

type Preset = '7d' | '14d' | '30d' | 'custom';

export interface DateRangeValue {
  preset: Preset;
  dateFrom?: string;
  dateTo?: string;
}

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: '7d', label: '近7天' },
  { key: '14d', label: '近14天' },
  { key: '30d', label: '近30天' },
  { key: 'custom', label: '自定义' },
];

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [localFrom, setLocalFrom] = useState(value.dateFrom ?? '');
  const [localTo, setLocalTo] = useState(value.dateTo ?? '');

  function handlePreset(preset: Preset) {
    if (preset === 'custom') {
      onChange({ preset: 'custom', dateFrom: localFrom, dateTo: localTo });
    } else {
      onChange({ preset });
    }
  }

  function handleDateChange(field: 'from' | 'to', val: string) {
    const nextFrom = field === 'from' ? val : localFrom;
    const nextTo = field === 'to' ? val : localTo;
    if (field === 'from') setLocalFrom(val);
    else setLocalTo(val);
    if (value.preset === 'custom') {
      onChange({ preset: 'custom', dateFrom: nextFrom, dateTo: nextTo });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              value.preset === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {value.preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={localFrom}
            onChange={(e) => handleDateChange('from', e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">至</span>
          <input
            type="date"
            value={localTo}
            onChange={(e) => handleDateChange('to', e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
