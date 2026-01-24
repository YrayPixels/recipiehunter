import { format } from 'date-fns';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Calendar as CalendarIcon, Plus, X } from 'react-native-feather';
import { getTodayDate } from '../lib/storage';
// Removed habit tracking store - not relevant to Recipe Hunter
// import { useHistoricalDaysStore } from '../lib/stores/historicalDaysStore';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Input } from './Input';

interface HistoricalDaysTrackerProps {
  onClose?: () => void;
}

export const HistoricalDaysTracker: React.FC<HistoricalDaysTrackerProps> = ({ onClose }) => {
  const { addHistoricalDaysRange, getHistoricalDays, removeHistoricalDay } = useHistoricalDaysStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'clean' | 'gave_in'>('clean');
  const [showForm, setShowForm] = useState(false);
  
  const historicalDays = getHistoricalDays();
  const today = getTodayDate();

  const handleAddRange = () => {
    if (!startDate || !endDate) return;
    
    // Validate dates
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    
    if (start > end) {
      alert('Start date must be before end date');
      return;
    }
    
    if (end >= todayDate) {
      alert('End date must be before today');
      return;
    }
    
    addHistoricalDaysRange(startDate, endDate, status);
    setStartDate('');
    setEndDate('');
    setShowForm(false);
  };

  const handleRemoveDay = (date: string) => {
    removeHistoricalDay(date);
  };

  return (
    <Card>
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <CardTitle className="flex-row items-center gap-2">
            <CalendarIcon width={18} height={18} color="#5a7a5a" />
            <Text className="text-lg font-semibold text-foreground dark:text-gray-100">
              Historical Days
            </Text>
          </CardTitle>
          {onClose && (
            <TouchableOpacity onPress={onClose} className="p-1">
              <X width={18} height={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </CardHeader>
      <CardContent>
        <Text className="text-sm text-muted-foreground dark:text-gray-400 mb-4">
          Add days you tracked before downloading the app (e.g., started on 1st, downloaded on 6th, add days 1-5)
        </Text>

        {!showForm ? (
          <Button
            onPress={() => setShowForm(true)}
            variant="outline"
            className="w-full mb-4"
          >
            <View className="flex-row items-center gap-2">
              <Plus width={16} height={16} color="#5a7a5a" />
              <Text>Add Historical Days</Text>
            </View>
          </Button>
        ) : (
          <View className="mb-4 p-4 border border-border dark:border-gray-700 rounded-lg">
            <View className="gap-3">
              <View>
                <Text className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                  Start Date
                </Text>
                <Input
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  className="rounded-lg"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                  End Date
                </Text>
                <Input
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  className="rounded-lg"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                  Status
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setStatus('clean')}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg items-center justify-center border',
                      status === 'clean'
                        ? 'bg-sage border-sage'
                        : 'bg-transparent border-border dark:border-gray-700'
                    )}
                    activeOpacity={0.7}
                  >
                    <Text className={cn(
                      'text-sm font-medium',
                      status === 'clean'
                        ? 'text-primary-foreground'
                        : 'text-foreground dark:text-gray-100'
                    )}>
                      Clean
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setStatus('gave_in')}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-lg items-center justify-center border',
                      status === 'gave_in'
                        ? 'bg-red-500/20 border-red-500'
                        : 'bg-transparent border-border dark:border-gray-700'
                    )}
                    activeOpacity={0.7}
                  >
                    <Text className={cn(
                      'text-sm font-medium',
                      status === 'gave_in'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-foreground dark:text-gray-100'
                    )}>
                      Gave In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-2">
                <Button
                  onPress={handleAddRange}
                  className="flex-1"
                  disabled={!startDate || !endDate}
                >
                  Add Days
                </Button>
                <Button
                  onPress={() => {
                    setShowForm(false);
                    setStartDate('');
                    setEndDate('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </View>
            </View>
          </View>
        )}

        {/* List of historical days */}
        {historicalDays.length > 0 && (
          <View className="mt-4">
            <Text className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">
              Added Days ({historicalDays.length})
            </Text>
            <View className="max-h-48 border border-border dark:border-gray-700 rounded-lg p-2">
              {historicalDays.slice(-10).reverse().map((day) => (
                <View
                  key={day.date}
                  className="flex-row items-center justify-between py-2 border-b border-border dark:border-gray-700 last:border-b-0"
                >
                  <View className="flex-1">
                    <Text className="text-sm text-foreground dark:text-gray-100">
                      {format(new Date(day.date + 'T00:00:00'), 'MMM d, yyyy')}
                    </Text>
                    <Text className={cn(
                      'text-xs mt-0.5',
                      day.status === 'clean' ? 'text-sage' : 'text-red-500'
                    )}>
                      {day.status === 'clean' ? 'Clean' : 'Gave In'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveDay(day.date)}
                    className="p-1"
                    activeOpacity={0.7}
                  >
                    <X width={16} height={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {historicalDays.length > 10 && (
                <Text className="text-xs text-muted-foreground dark:text-gray-400 text-center mt-2">
                  Showing last 10 of {historicalDays.length} days
                </Text>
              )}
            </View>
          </View>
        )}
      </CardContent>
    </Card>
  );
};

