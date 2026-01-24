import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Journal, JournalHeader } from '../src/components/Journal';
import { Paywall } from '../src/components/Paywall';
import { getTodayDate } from '../src/lib/storage';

const JournalPage: React.FC = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  
  const today = getTodayDate();
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = selectedDateStr === today;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-gray-900" edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Fixed Header */}
        <View className="bg-background dark:bg-gray-900 border-b border-border/50 dark:border-gray-700/50">
          <View className="container max-w-lg mx-auto px-4">
            <JournalHeader
              selectedDate={selectedDate}
              isToday={isToday}
              onBack={() => router.back()}
              onDateChange={setSelectedDate}
              onCalendarToggle={() => setShowCalendar(!showCalendar)}
              showCalendar={showCalendar}
            />
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          bounces={true}
        >
          <View className="container max-w-lg mx-auto px-4 pb-12 pt-4">
            <Journal 
              onBack={() => router.back()}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onCalendarToggle={() => setShowCalendar(!showCalendar)}
              showCalendar={showCalendar}
              onShowPaywall={() => setShowPaywall(true)}
            />
          </View>
          <Paywall
            visible={showPaywall}
            onClose={() => setShowPaywall(false)}
            feature="journal_unlimited"
            featureName="Unlimited Journal Entries"
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default JournalPage;

