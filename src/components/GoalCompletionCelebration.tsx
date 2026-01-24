import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Award, X } from 'react-native-feather';
import { Goal } from '../lib/storage';
import { Button } from './Button';

interface GoalCompletionCelebrationProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
}

export const GoalCompletionCelebration: React.FC<GoalCompletionCelebrationProps> = ({
  visible,
  goal,
  onClose,
}) => {
  if (!goal) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-4">
        <View className="bg-background rounded-3xl p-6 w-full max-w-sm border border-border shadow-lg">
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-4 w-8 h-8 items-center justify-center"
            activeOpacity={0.7}
          >
            <X width={20} height={20} color="#5a7a5a" />
          </TouchableOpacity>

          {/* Celebration content */}
          <View className="items-center">
            {/* Icon */}
            <View className="w-20 h-20 rounded-full bg-sage-light items-center justify-center mb-4">
              <Award width={40} height={40} color="#5a7a5a" />
            </View>

            {/* Title */}
            <Text className="text-3xl font-bold text-foreground mb-2 text-center">
              🎉 Goal Achieved! 🎉
            </Text>

            {/* Goal Title */}
            <View className="bg-primary rounded-lg px-6 py-3 mb-4">
              <Text className="text-xl font-bold text-primary-foreground text-center">
                {goal.title}
              </Text>
            </View>

            {/* Message */}
            <Text className="text-base text-muted-foreground text-center mb-6">
              Congratulations! You've reached your goal of {goal.targetDays} days. This is an incredible achievement!
            </Text>

            {/* Stats */}
            <View className="bg-sage-light rounded-lg p-4 mb-6 w-full">
              <Text className="text-sm font-semibold text-foreground mb-1 text-center">
                Goal Completed
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                {goal.completedDate 
                  ? `Completed on ${new Date(goal.completedDate).toLocaleDateString()}`
                  : 'Completed today!'}
              </Text>
            </View>

            {/* Close button */}
            <Button onPress={onClose} className="w-full">
              Continue Journey
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

