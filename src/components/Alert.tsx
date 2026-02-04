import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, CheckCircle, Info, X } from 'react-native-feather';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/utils';
import { Button } from './Button';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  onClose: () => void;
}



const getAlertConfig = (type: AlertType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle,
        iconColor: '#10b981',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
      };
    case 'error':
      return {
        icon: AlertTriangle,
        iconColor: '#ef4444',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        iconColor: '#f59e0b',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
      };
    case 'info':
    default:
      return {
        icon: Info,
        iconColor: '#5a7a5a',
        bgColor: 'bg-sage-light dark:bg-gray-800',
        borderColor: 'border-border dark:border-gray-700',
      };
  }
};

export const Alert: React.FC<AlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons,
  onClose,
}) => {
  const { effectiveTheme } = useTheme();
  const config = getAlertConfig(type);
  const Icon = config.icon;
  const closeIconColor = effectiveTheme === 'dark' ? '#d1d5db' : '#5a7a5a';

  // Default buttons if none provided
  const defaultButtons: AlertButton[] = buttons || [
    { text: 'OK', onPress: onClose, style: 'default' },
  ];

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-4">
        <View
          className={cn(
            'bg-background dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm border shadow-lg',
            config.borderColor
          )}
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-4 w-8 h-8 items-center justify-center z-10"
            activeOpacity={0.7}
          >
            <X width={20} height={20} color={closeIconColor} />
          </TouchableOpacity>

          {/* Content */}
          <View className="items-center">
            {/* Icon */}
            <View
              className={cn(
                'w-16 h-16 rounded-full items-center justify-center mb-4',
                config.bgColor
              )}
            >
              <Icon width={32} height={32} color={config.iconColor} />
            </View>

            {/* Title */}
            <Text className="text-xl  text-foreground dark:text-gray-100 mb-2 text-center">
              {title}
            </Text>

            {/* Message */}
            {message && (
              <Text className="text-base text-muted-foreground dark:text-gray-400 text-center mb-6">
                {message}
              </Text>
            )}

            {/* Buttons */}
            <View className="w-full gap-2">
              {defaultButtons.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';

                if (defaultButtons.length === 1) {
                  return (
                    <Button
                      key={index}
                      onPress={() => handleButtonPress(button)}
                      className="w-full"
                      variant={isDestructive ? 'outline' : 'default'}
                    >
                      {button.text}
                    </Button>
                  );
                }

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleButtonPress(button)}
                    className={cn(
                      'px-4 py-3 rounded-lg items-center justify-center border',
                      isDestructive
                        ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                        : isCancel
                          ? 'border-border dark:border-gray-700 bg-transparent'
                          : 'border-primary bg-primary'
                    )}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={cn(
                        'font-medium',
                        isDestructive
                          ? 'text-red-600 dark:text-red-400'
                          : isCancel
                            ? 'text-foreground dark:text-gray-100'
                            : 'text-primary-foreground'
                      )}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

