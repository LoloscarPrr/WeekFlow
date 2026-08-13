import { forwardRef, useCallback, useState } from 'react';
import { RefreshControl, ScrollView, type ScrollViewProps } from 'react-native';
import { colors } from '@/src/theme/colors';

type RefreshableScrollViewProps = ScrollViewProps & {
  onRefreshData?: () => void | Promise<void>;
};

export const RefreshableScrollView = forwardRef<ScrollView, RefreshableScrollViewProps>(
  function RefreshableScrollView({ onRefreshData, ...props }, ref) {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
      if (refreshing || !onRefreshData) return;
      setRefreshing(true);
      try {
        await onRefreshData();
        await new Promise((resolve) => setTimeout(resolve, 420));
      } finally {
        setRefreshing(false);
      }
    }, [onRefreshData, refreshing]);

    return (
      <ScrollView
        ref={ref}
        {...props}
        overScrollMode="always"
        contentContainerStyle={[{ flexGrow: 1 }, props.contentContainerStyle]}
        refreshControl={onRefreshData ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.blue]}
            progressBackgroundColor="#08152A"
            progressViewOffset={64}
          />
        ) : undefined}
      />
    );
  },
);
