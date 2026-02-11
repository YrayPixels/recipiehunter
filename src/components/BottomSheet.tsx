import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import BottomSheetLib, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface BottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetLib | null>;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
  enablePanDownToClose?: boolean;
  backgroundStyle?: object;
  handleIndicatorStyle?: object;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  bottomSheetRef,
  children,
  snapPoints = ['75%', '90%'],
  onClose,
  enablePanDownToClose = true,
  backgroundStyle,
  handleIndicatorStyle,
}) => {
  const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1 && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const defaultBackgroundStyle = {
    backgroundColor: 'hsl(40 30% 97%)',
    ...backgroundStyle,
  };

  const defaultHandleIndicatorStyle = {
    backgroundColor: 'hsl(35 20% 88%)',
    ...handleIndicatorStyle,
  };

  return (
    <BottomSheetLib
      ref={bottomSheetRef}
      index={-1}
      snapPoints={memoizedSnapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={enablePanDownToClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={defaultBackgroundStyle}
      handleIndicatorStyle={defaultHandleIndicatorStyle}
      enableHandlePanningGesture={true}
      enableContentPanningGesture={true}
      android_keyboardInputMode="adjustResize"
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardAvoidMode="padding"
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetLib>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
});

