import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Activity, Check, Coffee, Minus, Moon, Navigation, Sun } from 'react-native-feather';
import { createDefaultDailyEntry, DailyEntry, getDailyEntry, getSettings, getTodayDate, saveDailyEntry } from '../lib/storage';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Checkbox } from './Checkbox';
import { Input } from './Input';
interface DailyTodoProps {
  onOpenJournal: () => void;
  onCompletionChange?: (count: number, total: number) => void;
}

const EnergyButton = ({
  level,
  selected,
  onPress
}: {
  level: 'low' | 'medium' | 'high';
  selected: boolean;
  onPress: () => void;
}) => {
  const labels = { low: 'Low', medium: 'Medium', high: 'High' };
  const colors = {
    low: 'bg-sand dark:bg-gray-700',
    medium: 'bg-accent dark:bg-gray-700',
    high: 'bg-sage-light dark:bg-gray-700',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={cn(
        'flex-1 py-3 px-4 rounded-lg border border-border dark:border-gray-600',
        colors[level],
        selected && level === 'low' && 'border-2 border-primary dark:border-primary',
        !selected && 'opacity-80'
      )}
      activeOpacity={0.7}
    >
      <Text className={cn(
        'text-sm font-medium text-center text-foreground dark:text-gray-100',
        selected && level === 'low' && 'text-primary dark:text-primary'
      )}>
        {labels[level]}
      </Text>
    </TouchableOpacity>
  );
};

const MovementToggle = ({
  type,
  icon: Icon,
  selected,
  onToggle,
}: {
  type: string;
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  selected: boolean;
  onToggle: () => void;
}) => {
  if (!Icon) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onToggle}
      className={cn(
        'flex-1 aspect-square rounded-3xl items-center justify-center gap-2 border border-border dark:border-gray-700',
        selected ? 'bg-sage dark:bg-gray-700' : 'bg-transparent dark:bg-gray-800/50'
      )}
      activeOpacity={0.7}
    >
      <Icon width={24} height={24} color={selected ? '#f5f3f0' : '#5a7a5a'} />
      <Text className={cn(
        'text-xs font-medium capitalize text-foreground dark:text-gray-100',
        selected && 'text-primary-foreground dark:text-gray-100'
      )}>
        {type}
      </Text>
    </TouchableOpacity>
  );
};

export const DailyTodo: React.FC<DailyTodoProps> = ({ onOpenJournal, onCompletionChange }) => {
  const today = getTodayDate();
  const [entry, setEntry] = useState<DailyEntry>(createDefaultDailyEntry(today));
  const [settings, setSettings] = useState({ affirmationText: "I am building the life I want, one day at a time." });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const loadedEntry = await getDailyEntry(today);
      const loadedSettings = await getSettings();
      if (loadedEntry) {
        setEntry(loadedEntry);
      }
      setSettings(loadedSettings);
      setLoading(false);
    };
    loadData();
  }, [today]);

  useEffect(() => {
    if (!loading) {
      saveDailyEntry(entry);
    }
  }, [entry, loading]);

  const updateEntry = (updates: Partial<DailyEntry>) => {
    setEntry(prev => ({ ...prev, ...updates }));
  };

  const toggleMovement = (type: 'walk' | 'workout' | 'stretch') => {
    const current = entry.movementType;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateEntry({ movementType: updated });
  };

  const completionCount = [
    entry.madeBed,
    entry.focusTaskCompleted,
    entry.energyLevel !== null,
    entry.didWell.length > 0,
    entry.movementType.length > 0,
    entry.phoneAway,
    entry.preparedTomorrow,
  ].filter(Boolean).length;

  const totalItems = 7;

  useEffect(() => {
    if (!loading && onCompletionChange) {
      onCompletionChange(completionCount, totalItems);
    }
  }, [completionCount, totalItems, loading, onCompletionChange]);

  if (loading) {
    return <View className="flex-1 items-center justify-center"><Text>Loading...</Text></View>;
  }

  return (
    <View className="gap-y-4">
      {/* Morning Block */}
      <Card>
        <CardHeader>
          <CardTitle className="flex-row items-center">
            <View className="flex-row items-center gap-2">
            <Sun width={20} height={20} color="#d97706" />
              <Text className="text-lg font-semibold text-foreground dark:text-gray-100">{'Morning'}</Text>
            </View>

          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center gap-3">
            <Checkbox
              checked={entry.madeBed}
              onCheckedChange={(checked) => updateEntry({ madeBed: checked })}
            />
            <Text className={cn(
              "text-sm text-foreground dark:text-gray-100",
              entry.madeBed && "text-muted-foreground dark:text-gray-400 line-through"
            )}>
              Wake up & make bed
            </Text>
          </View>

          <View className="bg-green-400/20 dark:bg-gray-800 rounded-lg p-4 mt-4">
            <Text className="italic text-sm text-foreground dark:text-gray-100/80">
              &ldquo;{settings.affirmationText}&rdquo;
            </Text>
          </View>

          <View className="space-y-2 mt-4">
            <Text className="text-sm font-medium text-foreground dark:text-gray-100">Today&apos;s one focus:</Text>
            <View className={entry.focusTaskCompleted ? "flex-row w-11/12 justify-between items-center gap-1" : "flex-row w-11/12 justify-between items-center gap-1"}>
              <Input
                value={entry.focusTask}
                onChangeText={(text) => updateEntry({ focusTask: text })}
                placeholder="What matters most today?"
                className="border-none flex-1 rounded-lg"
              />
              {entry.focusTask.length > 0 && (
                <TouchableOpacity
                  onPress={() => updateEntry({ focusTaskCompleted: !entry.focusTaskCompleted })}
                  className={cn(
                    'w-10 h-10 rounded-lg items-center justify-center border-none rounded-lg bg-green-500/50',
                    entry.focusTaskCompleted ? 'bg-primary' : 'border border-border dark:border-gray-700'
                  )}
                >
                  <Check width={16} height={16} color={entry.focusTaskCompleted ? '#f5f3f0' : '#5a7a5a'} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Midday Check-in */}
      <Card>
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-2">
              <Coffee width={20} height={20} color="#d97706" />
              <Text className="text-lg font-semibold text-foreground dark:text-gray-100">{'Midday Check-in'}</Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="gap-y-2">
            <Text className="text-sm font-medium text-foreground dark:text-gray-100">How&apos;s your energy?</Text>
            <View className="flex-row gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <EnergyButton
                  key={level}
                  level={level}
                  selected={entry.energyLevel === level}
                  onPress={() => updateEntry({ energyLevel: level })}
                />
              ))}
            </View>
          </View>

          <View className="gap-y-2 mt-5">
            <Text className="text-sm font-medium text-foreground dark:text-gray-100">One thing I did well:</Text>
            <Input
              className="border-none rounded-lg"
              value={entry.didWell}
              onChangeText={(text) => updateEntry({ didWell: text })}
              placeholder="Celebrate a small win..."
            />
          </View>
        </CardContent>
      </Card>

      {/* Body Movement */}
      <Card>
        <CardHeader>
          <View className="flex-row items-center">
            <CardTitle>
              <Text className="text-foreground dark:text-gray-100">Body Movement</Text>
            </CardTitle>
            <Text className="ml-2 text-xs font-normal text-muted-foreground dark:text-gray-400">
              (choose at least one)
            </Text>
          </View>
        </CardHeader>
        <CardContent>
          <View className="flex-row gap-2">
            <MovementToggle
              type="walk"
              icon={Navigation}
              selected={entry.movementType.includes('walk')}
              onToggle={() => toggleMovement('walk')}
            />
            <MovementToggle
              type="workout"
              icon={Activity}
              selected={entry.movementType.includes('workout')}
              onToggle={() => toggleMovement('workout')}
            />
            <MovementToggle
              type="stretch"
              icon={Minus}
              selected={entry.movementType.includes('stretch')}
              onToggle={() => toggleMovement('stretch')}
            />
          </View>
        </CardContent>
      </Card>

      {/* Evening Shutdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex-row items-center gap-2">
            <Moon width={20} height={20} color="#5a7a5a" />
            <Text className="text-lg font-semibold text-foreground dark:text-gray-100">Evening Shutdown</Text>
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-y-2">
          <View className="flex-row items-center gap-3">
            <Checkbox
              checked={entry.phoneAway}
              onCheckedChange={(checked) => updateEntry({ phoneAway: checked })}
            />
            <Text className={cn(
              "text-sm text-foreground dark:text-gray-100",
              entry.phoneAway && "text-muted-foreground dark:text-gray-400 line-through"
            )}>
              Phone away from bed
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <Checkbox
              checked={entry.preparedTomorrow}
              onCheckedChange={(checked) => updateEntry({ preparedTomorrow: checked })}
            />
            <Text className={cn(
              "text-sm text-foreground dark:text-gray-100",
              entry.preparedTomorrow && "text-muted-foreground dark:text-gray-400 line-through"
            )}>
              Prepare for tomorrow
            </Text>
          </View>

          <Button
            onPress={onOpenJournal}
            className="w-full mt-2 bg-green-500/50 rounded-lg"
            variant="outline"
          >
            Open Journal
          </Button>
        </CardContent>
      </Card>
    </View>
  );
};

