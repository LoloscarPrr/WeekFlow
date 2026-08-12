import { createContext, type PropsWithChildren, useCallback, useContext, useState } from 'react';
import { RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';
import { colors } from '@/src/theme/colors';

const RefreshContext = createContext<() => void>(() => undefined);

export function AppRefreshProvider({ children, onRefresh }: PropsWithChildren<{ onRefresh: () => void }>) {
  return <RefreshContext.Provider value={onRefresh}>{children}</RefreshContext.Provider>;
}

export function RefreshableScrollView(props: ScrollViewProps) {
  const requestAppRefresh = useContext(RefreshContext);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);

    // Give Android enough time to show the native pull indicator, then
    // remount the active route so it rereads the persisted WeekFlow state.
    setTimeout(() => {
      setRefreshing(false);
      requestAppRefresh();
    }, 320);
  }, [refreshing, requestAppRefresh]);

  return (
    <ScrollView
      {...props}
      alwaysBounceVertical
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.blue]}
          progressBackgroundColor="#08152A"
          progressViewOffset={8}
        />
      )}
    />
  );
}
