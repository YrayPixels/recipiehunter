import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'react-native-feather';
import { cn } from '../lib/utils';
import { Card, CardContent } from './Card';

interface CalendarPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateSelect,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);
  const today = new Date();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = getDay(monthStart);
  // Adjust for Monday as first day (if first day is Sunday (0), show 6 empty cells)
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Create array with empty cells at the start
  const emptyCells = Array(startOffset).fill(null);
  const allDays = [...emptyCells, ...daysInMonth];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        {/* Month Navigation */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => navigateMonth('prev')}
            className="p-2"
            activeOpacity={0.7}
          >
            <ChevronLeft width={20} height={20} color="#5a7a5a" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground dark:text-gray-100">
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity
            onPress={() => navigateMonth('next')}
            className="p-2"
            activeOpacity={0.7}
          >
            <ChevronRight width={20} height={20} color="#5a7a5a" />
          </TouchableOpacity>
        </View>

        {/* Week Day Headers */}
        <View className="flex-row mb-2">
          {weekDays.map((day) => (
            <View key={day} className="flex-1 items-center">
              <Text className="text-xs font-medium text-muted-foreground dark:text-gray-400">
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View className="flex-row flex-wrap">
          {allDays.map((day, index) => {
            if (day === null) {
              return <View key={`empty-${index}`} className="w-[14.28%] aspect-square" />;
            }

            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);

            return (
              <TouchableOpacity
                key={day.toISOString()}
                onPress={() => handleDateSelect(day)}
                className={cn(
                  'w-[14.28%] aspect-square items-center justify-center rounded-lg',
                  isSelected && 'bg-primary',
                  isToday && !isSelected && 'bg-sage-light'
                )}
                activeOpacity={0.7}
              >
                <Text
                  className={cn(
                    'text-sm font-medium',
                    isSelected
                      ? 'text-primary-foreground'
                      : isToday
                        ? 'text-sage '
                        : 'text-foreground dark:text-gray-100'
                  )}
                >
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </CardContent>
    </Card>
  );
};

