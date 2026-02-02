import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BookOpen, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Lock, XCircle } from 'react-native-feather';
import { canCreateJournalEntry } from '../lib/features';
import { createDefaultJournalEntry, getJournalEntry, getTodayDate, JournalEntry, saveJournalEntry } from '../lib/storage';
import { cn } from '../lib/utils';
import { CalendarPicker } from './CalendarPicker';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Input } from './Input';

interface JournalProps {
  onBack: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onCalendarToggle: () => void;
  showCalendar: boolean;
  onShowPaywall?: () => void;
}

const URGE_FEELINGS = ['Bored', 'Lonely', 'Stressed', 'Tired', 'Anxious'];
const RESPONSE_ACTIONS = [
  'Distracted myself',
  'Moved my body',
  'Talked to someone',
  'Gave in',
];

const ToggleChip = ({
  label,
  selected,
  onToggle,
  neutral = false,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  neutral?: boolean;
}) => (
  <TouchableOpacity
    onPress={onToggle}
    className={cn(
      'px-4 py-3 rounded-lg border',
      neutral && selected && 'bg-sand border-sand',
      !neutral && selected && 'bg-sage border-sage',
      !selected && 'bg-transparent border-border dark:border-gray-700'
    )}
    activeOpacity={0.7}
  >
    <Text className={cn(
      'text-sm font-medium text-center',
      selected && !neutral && 'text-primary-foreground',
      selected && neutral && 'text-foreground dark:text-gray-100',
      !selected && 'text-foreground dark:text-gray-100'
    )}>
      {label}
    </Text>
  </TouchableOpacity>
);

interface JournalHeaderProps {
  selectedDate: Date;
  isToday: boolean;
  onBack: () => void;
  onDateChange: (date: Date) => void;
  onCalendarToggle: () => void;
  showCalendar: boolean;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  selectedDate,
  isToday,
  onBack,
  onDateChange,
  onCalendarToggle,
  showCalendar,
}) => {
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    onDateChange(newDate);
  };

  return (
    <View className="py-4">
      {/* Navigation Row */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center gap-2 -ml-2 px-2 py-1"
          activeOpacity={0.7}
        >
          <ChevronLeft width={18} height={18} color="#5a7a5a" />
          <Text className="text-sm text-foreground dark:text-gray-100 font-medium">Back</Text>
        </TouchableOpacity>
        
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => navigateDate('prev')}
            className="w-9 h-9 border border-border dark:border-gray-700 rounded-lg items-center justify-center bg-card dark:bg-gray-800"
            activeOpacity={0.7}
          >
            <ChevronLeft width={18} height={18} color="#5a7a5a" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCalendarToggle}
            className="px-3 py-2 border border-border dark:border-gray-700 rounded-lg flex-row items-center gap-2 bg-card dark:bg-gray-800"
            activeOpacity={0.7}
          >
            <CalendarIcon width={16} height={16} color="#5a7a5a" />
            <Text className="text-sm text-foreground dark:text-gray-100 font-medium">Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigateDate('next')}
            className="w-9 h-9 border border-border dark:border-gray-700 rounded-lg items-center justify-center bg-card dark:bg-gray-800"
            activeOpacity={0.7}
          >
            <ChevronRight width={18} height={18} color="#5a7a5a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title Section */}
      <View>
        <View className="flex-row items-center gap-3 mb-2">
          <View className="h-10 w-10 rounded-lg bg-sage-light items-center justify-center">
            <BookOpen width={20} height={20} color="#5a7a5a" />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-gray-100">Daily Journal</Text>
        </View>
        <View className="flex-row items-center gap-2 ml-[52px]">
          <Text className="text-sm text-muted-foreground dark:text-gray-400">
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          {!isToday && (
            <TouchableOpacity 
              onPress={() => {
                const today = new Date();
                onDateChange(today);
              }}
              activeOpacity={0.7}
            >
              <Text className="text-xs text-hope font-medium">(Go to today)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export const Journal: React.FC<JournalProps> = ({ 
  onBack, 
  selectedDate, 
  onDateChange, 
  onCalendarToggle, 
  showCalendar,
  onShowPaywall
}) => {
  const today = getTodayDate();
  const [entry, setEntry] = useState<JournalEntry>(createDefaultJournalEntry(today));
  const [otherFeeling, setOtherFeeling] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasExistingEntry, setHasExistingEntry] = useState(false);
  const [journalLimit, setJournalLimit] = useState<{ allowed: boolean; reason?: string; countThisWeek?: number } | null>(null);
  
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = selectedDateStr === today;

  useEffect(() => {
    const loadData = async () => {
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadEntry = async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dateEntry = await getJournalEntry(dateStr);
      const exists = dateEntry !== null;
      setHasExistingEntry(exists);
      setEntry(dateEntry || createDefaultJournalEntry(dateStr));
      setOtherFeeling('');
      
      // Check journal entry limits for new entries
      if (!exists) {
        const limitCheck = await canCreateJournalEntry(dateStr);
        setJournalLimit(limitCheck);
      } else {
        setJournalLimit({ allowed: true });
      }
    };
    if (!loading) {
      loadEntry();
    }
  }, [selectedDate, loading]);

  useEffect(() => {
    if (!loading && entry && hasExistingEntry) {
      // Only auto-save if editing existing entry or if new entry is allowed
      if (hasExistingEntry || journalLimit?.allowed) {
        saveJournalEntry(entry);
      }
    }
  }, [entry, loading, selectedDate, hasExistingEntry, journalLimit]);

  const updateEntry = (updates: Partial<JournalEntry>) => {
    setEntry((prev) => ({ ...prev, ...updates }));
  };

  const toggleFeeling = (feeling: string) => {
    const current = entry.urgeFeelings;
    const updated = current.includes(feeling)
      ? current.filter((f) => f !== feeling)
      : [...current, feeling];
    updateEntry({ urgeFeelings: updated });
  };

  const toggleResponse = (action: string) => {
    const current = entry.responseActions;
    const updated = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    updateEntry({ responseActions: updated });
  };

  const addOtherFeeling = () => {
    if (otherFeeling.trim() && !entry.urgeFeelings.includes(otherFeeling.trim())) {
      toggleFeeling(otherFeeling.trim());
      setOtherFeeling('');
    }
  };


  if (loading) {
    return <View className="flex-1 items-center justify-center"><Text>Loading...</Text></View>;
  }

  const isBlocked = !hasExistingEntry && journalLimit && !journalLimit.allowed;

  return (
    <View className="gap-y-4">
      {/* Calendar Picker */}
      {showCalendar && (
        <CalendarPicker
          selectedDate={selectedDate}
          onDateSelect={onDateChange}
          onClose={onCalendarToggle}
        />
      )}

      {/* Journal Limit Warning */}
      {!hasExistingEntry && journalLimit && (
        <Card className={cn(
          journalLimit.allowed && journalLimit.countThisWeek !== undefined && journalLimit.countThisWeek >= 2
            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
            : !journalLimit.allowed
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : ''
        )}>
          <CardContent className="pt-4">
            <View className="flex-row items-start gap-3">
              {!journalLimit.allowed ? (
                <Lock width={20} height={20} color="#ef4444" className="mt-0.5" />
              ) : (
                <BookOpen width={20} height={20} color="#f59e0b" className="mt-0.5" />
              )}
              <View className="flex-1">
                <Text className={cn(
                  'text-sm font-medium',
                  !journalLimit.allowed
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-yellow-700 dark:text-yellow-400'
                )}>
                  {!journalLimit.allowed
                    ? 'Journal Entry Limit Reached'
                    : `You've used ${journalLimit.countThisWeek || 0} of 3 free journal entries this week`}
                </Text>
                {!journalLimit.allowed && (
                  <Text className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {journalLimit.reason}
                  </Text>
                )}
                {!journalLimit.allowed && (
                  <TouchableOpacity
                    onPress={() => onShowPaywall?.()}
                    className="mt-3 bg-primary px-4 py-2 rounded-lg"
                    activeOpacity={0.7}
                  >
                    <Text className="text-sm font-semibold text-primary-foreground text-center">
                      Upgrade to Premium
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </CardContent>
        </Card>
      )}
      
      {/* Today in one sentence */}
      <Card className={cn(isBlocked && 'opacity-50')}>
        <CardHeader>
          <CardTitle>Today in one sentence</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            className='rounded-lg'
            value={entry.todaySentence}
            onChangeText={(text) => updateEntry({ todaySentence: text })}
            placeholder="How would you summarize today?"
            editable={!isBlocked}
          />
        </CardContent>
      </Card>

      {/* Urge Check */}
      <Card className={cn(isBlocked && 'opacity-50')}>
        <CardHeader>
          <CardTitle>Urge Check</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => updateEntry({ urgeExperienced: true })}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg items-center justify-center border',
                entry.urgeExperienced 
                  ? 'bg-primary border-primary' 
                  : 'bg-transparent border-border dark:border-gray-700'
              )}
              activeOpacity={0.7}
            >
              <Text className={cn(
                'text-sm font-medium',
                entry.urgeExperienced 
                  ? 'text-primary-foreground' 
                  : 'text-foreground dark:text-gray-100'
              )}>
                Yes, I had urges
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateEntry({ urgeExperienced: false })}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg items-center justify-center border',
                !entry.urgeExperienced 
                  ? 'bg-primary border-primary' 
                  : 'bg-transparent border-border dark:border-gray-700'
              )}
              activeOpacity={0.7}
            >
              <Text className={cn(
                'text-sm font-medium',
                !entry.urgeExperienced 
                  ? 'text-primary-foreground' 
                  : 'text-foreground dark:text-gray-100'
              )}>
                No urges today
              </Text>
            </TouchableOpacity>
          </View>

          {entry.urgeExperienced && (
            <View className="gap-y-4 pt-2">
              <View className="gap-y-3 mt-4">
                <View className="gap-y-2">
                  <Text className="text-sm font-medium text-foreground dark:text-gray-100">When did it happen?</Text>
                  <Input
                    className='rounded-lg'
                    value={entry.urgeTime}
                    onChangeText={(text) => updateEntry({ urgeTime: text })}
                    placeholder="e.g., Around 10pm, after work..."
                  />
                </View>

                <View className="gap-y-2">
                  <Text className="text-sm font-medium text-foreground dark:text-gray-100">
                    What were you feeling before?
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {URGE_FEELINGS.map((feeling) => (
                      <ToggleChip
                        key={feeling}
                        label={feeling}
                        selected={entry.urgeFeelings.includes(feeling)}
                        onToggle={() => toggleFeeling(feeling)}
                      />
                    ))}
                  </View>
                  <View className="flex-row gap-2 mt-2">
                    <Input
                      value={otherFeeling}
                      onChangeText={setOtherFeeling}
                      placeholder="Other feeling..."
                      className="flex-1 rounded-lg"
                    />
                    <TouchableOpacity
                      onPress={addOtherFeeling}
                      className="px-4 py-3 border border-border dark:border-gray-700 rounded-lg items-center justify-center bg-card dark:bg-gray-800"
                      activeOpacity={0.7}
                    >
                      <Text className="text-sm font-medium text-foreground dark:text-gray-100">Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="space-y-2">
                  <Text className="text-sm font-medium text-foreground dark:text-gray-100">How did you respond?</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {RESPONSE_ACTIONS.map((action) => (
                      <ToggleChip
                        key={action}
                        label={action}
                        selected={entry.responseActions.includes(action)}
                        onToggle={() => toggleResponse(action)}
                        neutral={action === 'Gave in'}
                      />
                    ))}
                  </View>
                  {entry.responseActions.includes('Gave in') && (
                    <View className="bg-sage-light rounded-lg p-3 mt-2">
                      <Text className="text-sm text-foreground dark:text-gray-100/80 italic">
                        This is data, not failure. Every slip teaches you something.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Reflection */}
      <Card className={cn(isBlocked && 'opacity-50')}>
        <CardHeader>
          <CardTitle>Reflection</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="gap-y-2">
            <Text className="text-sm font-medium text-foreground dark:text-gray-100">What did you learn today?</Text>
            <Input
              value={entry.lessonLearned}
              className='rounded-lg'
              onChangeText={(text) => updateEntry({ lessonLearned: text })}
              placeholder="Any insights about yourself, your triggers, or what helps..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View className="gap-y-2 mt-4">
            <Text className="text-sm font-medium text-foreground dark:text-gray-100">One win today</Text>
            <Input
              className='rounded-lg'
              value={entry.dailyWin}
              onChangeText={(text) => updateEntry({ dailyWin: text })}
              placeholder="Even small wins count..."
            />
          </View>

          <View className="gap-y-2 mt-4">
            <Text className="text-sm font-medium text-foreground dark:text-gray-100">Tomorrow, I will...</Text>
            <Input
              className='rounded-lg'
              value={entry.tomorrowIntention}
              onChangeText={(text) => updateEntry({ tomorrowIntention: text })}
              placeholder="Set one intention for tomorrow"
            />
          </View>
        </CardContent>
      </Card>

      <View className="pt-2 pb-4">
        <TouchableOpacity
          onPress={async () => {
            if (isBlocked) {
              onShowPaywall?.();
              return;
            }
            // Save entry if it's allowed
            if (hasExistingEntry || journalLimit?.allowed) {
              await saveJournalEntry(entry);
            }
            onBack();
          }}
          className={cn(
            'w-full py-3 px-4 rounded-lg items-center justify-center',
            isBlocked ? 'bg-gray-400' : 'bg-primary'
          )}
          activeOpacity={0.7}
        >
          <Text className={cn(
            'text-base font-semibold',
            isBlocked ? 'text-gray-600' : 'text-primary-foreground'
          )}>
            {isBlocked ? 'Upgrade to Save' : 'Save & Close'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

