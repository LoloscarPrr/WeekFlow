import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';
import { colors } from '@/src/theme/colors';

type RefreshableScrollViewProps = ScrollViewProps & {
  onRefreshData?: () => void | Promise<void>;
};

export function RefreshableScrollView({ onRefreshData, ...props }: RefreshableScrollViewProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await onRefreshData?.();
      // Keep the native indicator visible long enough to feel intentional
      // without unmounting the route or fighting Android's scroll animation.
      await new Promise((resolve) => setTimeout(resolve, 420));
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshData, refreshing]);

  return (
    <ScrollView
      {...props}
      overScrollMode="always"
      contentContainerStyle={[{ flexGrow: 1 }, props.contentContainerStyle]}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.blue]}
          progressBackgroundColor="#08152A"
          progressViewOffset={12}
        />
      )}
    />
  );
}
