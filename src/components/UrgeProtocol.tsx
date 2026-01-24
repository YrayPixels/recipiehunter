import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import BottomSheetLib from '@gorhom/bottom-sheet';
import { Activity, Droplet, Navigation, Heart } from 'react-native-feather';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { BottomSheet } from './BottomSheet';
import { useTheme } from '../lib/theme';

interface UrgeProtocolProps {
  bottomSheetRef: React.RefObject<BottomSheetLib | null>;
  onClose?: () => void;
}

const actions = [
  { id: 'pushups', icon: Activity, label: 'Do 20 pushups' },
  { id: 'water', icon: Droplet, label: 'Cold water on face' },
  { id: 'walk', icon: Navigation, label: 'Walk for 5 minutes' },
];

export const UrgeProtocol: React.FC<UrgeProtocolProps> = ({ bottomSheetRef, onClose }) => {
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const { effectiveTheme } = useTheme();

  const toggleAction = (action: string) => {
    setCompletedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
    if (onClose) {
      onClose();
    }
  }, [bottomSheetRef, onClose]);

  return (
    <BottomSheet bottomSheetRef={bottomSheetRef} onClose={onClose}>
      <View className="px-4 pt-2 bg-background dark:bg-background-dark">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark mb-1">
            Emergency Protocol
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            Follow these steps when you feel an urge
          </Text>
        </View>

        {/* Step 1 - Pause */}
        <Card className="mb-4">
          <CardContent>
            <View className="flex-row items-start gap-3">
              <View className="h-8 w-8 rounded-full bg-primary dark:bg-primary-dark items-center justify-center flex-shrink-0 mt-0.5">
                <Text className="text-sm font-bold text-primary-foreground dark:text-primary-foreground-dark">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-1">
                  Pause
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  Don&apos;t negotiate with the urge. Just pause.
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Step 2 - Stand Up */}
        <Card className="mb-4">
          <CardContent>
            <View className="flex-row items-start gap-3">
              <View className="h-8 w-8 rounded-full bg-primary dark:bg-primary-dark items-center justify-center flex-shrink-0 mt-0.5">
                <Text className="text-sm font-bold text-primary-foreground dark:text-primary-foreground-dark">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark mb-1">
                  Stand Up
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  Change your physical position immediately.
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Step 3 - Take Action */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex-row items-center gap-3">
              <View className="h-8 w-8 rounded-full bg-primary dark:bg-primary-dark items-center justify-center">
                <Text className="text-sm font-bold text-primary-foreground dark:text-primary-foreground-dark">3</Text>
              </View>
              <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
                Take Action
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View className="gap-3">
              {actions.map((action) => {
                const Icon = action.icon;
                const completed = completedActions.includes(action.id);
                return (
                  <View
                    key={action.id}
                    className={cn(
                      'flex-row items-center gap-3 p-3 rounded-lg border',
                      completed 
                        ? 'bg-sage-light dark:bg-sage/20 border-primary dark:border-primary-dark' 
                        : 'bg-card dark:bg-card-dark border-border dark:border-gray-700'
                    )}
                  >
                    <Icon 
                      width={20} 
                      height={20} 
                      color={effectiveTheme === 'dark' ? '#7a9a7a' : '#5a7a5a'} 
                    />
                    <View className="flex-1">
                      <Text className={cn(
                        'text-sm font-medium text-foreground dark:text-foreground-dark',
                        completed && 'line-through text-muted-foreground dark:text-muted-foreground-dark'
                      )}>
                        {action.label}
                      </Text>
                    </View>
                    <Checkbox
                      checked={completed}
                      onCheckedChange={() => toggleAction(action.id)}
                    />
                  </View>
                );
              })}
            </View>
          </CardContent>
        </Card>

        {/* Affirmation */}
        <Card className="mb-4 bg-sage-light dark:bg-sage/20">
          <CardContent>
            <View className="items-center">
              <View className="mb-2">
                <Heart width={24} height={24} color={effectiveTheme === 'dark' ? '#7a9a7a' : '#5a7a5a'} />
              </View>
              <Text className="text-base italic text-foreground dark:text-foreground-dark/80 text-center">
                &ldquo;This urge will pass whether I act or not.&rdquo;
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Close button */}
        <Button
          onPress={handleClose}
          variant="outline"
          className="w-full"
        >
          I&apos;m feeling better
        </Button>
      </View>
    </BottomSheet>
  );
};

