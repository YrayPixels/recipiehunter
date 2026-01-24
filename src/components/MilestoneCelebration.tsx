import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Share, Text, TouchableOpacity, View } from 'react-native';
import { Award, Share2, X } from 'react-native-feather';
import { getMilestoneMessage, getSettings } from '../lib/storage';
import { Button } from './Button';

interface MilestoneCelebrationProps {
  visible: boolean;
  milestone: number | null;
  onClose: () => void;
}

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  visible,
  milestone,
  onClose,
}) => {
  const confettiAnimations = useRef(
    Array.from({ length: 50 }, () => ({
      translateY: new Animated.Value(-100),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible && milestone) {
      // Animate confetti
      confettiAnimations.forEach((anim, index) => {
        const delay = index * 20;
        const duration = 2000 + Math.random() * 1000;
        const translateX = (Math.random() - 0.5) * 400;
        const rotate = Math.random() * 720;

        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: 1000,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: translateX,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: rotate,
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(delay + duration * 0.7),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    } else {
      // Reset animations
      confettiAnimations.forEach((anim) => {
        anim.translateY.setValue(-100);
        anim.translateX.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
      });
    }
  }, [visible, milestone]);

  const handleShare = async () => {
    if (!milestone) return;
    
    const settings = await getSettings();
    const habitLabel = settings.primaryHabit 
      ? settings.primaryHabit.charAt(0).toUpperCase() + settings.primaryHabit.slice(1)
      : 'recovery';
    
    const message = `🎉 I just reached ${milestone} days ${habitLabel}-free! 🎉\n\nThis journey has been challenging, but I'm proud of my progress. Every day is a step toward a better me.\n\n#BreakFree #Recovery #Milestone`;
    
    try {
      await Share.share({
        message,
        title: `${milestone} Day Milestone`,
      });
    } catch (error) {
      console.error('Error sharing milestone:', error);
    }
  };

  if (!milestone) return null;

  const message = getMilestoneMessage(milestone);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-4 overflow-hidden">
        {/* Confetti */}
        {visible && (
          <View className="absolute inset-0 pointer-events-none">
            {confettiAnimations.map((anim, index) => {
              const colors = ['#5a7a5a', '#8b9a8b', '#a8b5a8', '#c4d4c4'];
              const color = colors[index % colors.length];
              const size = 8 + Math.random() * 8;
              const left = `${(index * 2) % 100}%`;

              return (
                <Animated.View
                  key={index}
                  style={{
                    position: 'absolute',
                    left,
                    width: size,
                    height: size,
                    backgroundColor: color,
                    transform: [
                      { translateY: anim.translateY },
                      { translateX: anim.translateX },
                      {
                        rotate: anim.rotate.interpolate({
                          inputRange: [0, 360],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                    opacity: anim.opacity,
                  }}
                />
              );
            })}
          </View>
        )}

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
              🎉 Milestone Reached! 🎉
            </Text>

            {/* Milestone */}
            <View className="bg-primary rounded-lg px-6 py-3 mb-4">
              <Text className="text-4xl font-bold text-primary-foreground text-center">
                {milestone} Days
              </Text>
            </View>

            {/* Message */}
            <Text className="text-base text-muted-foreground text-center mb-6">
              {message}
            </Text>

            {/* Badge info */}
            <View className="bg-sage-light rounded-lg p-4 mb-6 w-full">
              <Text className="text-sm font-semibold text-foreground mb-1 text-center">
                Achievement Unlocked
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                You've earned the {milestone}-day badge!
              </Text>
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-2 w-full">
              <TouchableOpacity
                onPress={handleShare}
                className="flex-1 border border-border rounded-lg px-4 py-3 items-center justify-center flex-row gap-2"
                activeOpacity={0.7}
              >
                <Share2 width={16} height={16} color="#5a7a5a" />
                <Text className="text-foreground font-medium">Share</Text>
              </TouchableOpacity>
              <Button onPress={onClose} className="flex-1">
                Continue Journey
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

