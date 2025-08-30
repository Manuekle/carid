'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(
    value ? (typeof value === 'string' ? new Date(value) : value) : undefined
  );

  useEffect(() => {
    setDate(value ? (typeof value === 'string' ? new Date(value) : value) : undefined);
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (onChange) {
      onChange(selectedDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal text-xs',
            !date && 'text-muted-foreground',
            className
          )}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          locale={es}
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear()}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );
}
