import React, { useState, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

interface DateRangePickerProps {
  value: { from: Date; to: Date };
  onChange: (value: { from: Date; to: Date }) => void;
}

const presets = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 14 Days', days: 14 },
  { label: 'Last 30 Days', days: 30 },
];

const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setIsOpen(false));

  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));
    onChange({ from, to });
    setIsOpen(false);
  };

  const displayValue = `${formatDate(value.from)} - ${formatDate(value.to)}`;

  return (
    <div ref={ref}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {displayValue}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {presets.map(preset => (
            <DropdownMenuItem key={preset.label} onClick={() => handlePresetClick(preset.days)}>
              {preset.label}
            </DropdownMenuItem>
          ))}
          <div className="border-t my-1" />
          <div className="p-2 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <label htmlFor="from-date" className="text-xs text-muted">From</label>
                <input
                  id="from-date"
                  type="date"
                  value={value.from.toISOString().split('T')[0]}
                  onChange={(e) => onChange({ ...value, from: new Date(e.target.value) })}
                  className="w-full text-sm p-1 border rounded-md bg-surface"
                />
              </div>
              <div>
                <label htmlFor="to-date" className="text-xs text-muted">To</label>
                <input
                  id="to-date"
                  type="date"
                  value={value.to.toISOString().split('T')[0]}
                  onChange={(e) => onChange({ ...value, to: new Date(e.target.value) })}
                  className="w-full text-sm p-1 border rounded-md bg-surface"
                />
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DateRangePicker;
