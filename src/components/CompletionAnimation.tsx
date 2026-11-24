import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

const COMPLETE_ANIMATION = require('../../assets/animations/weekflow-complete.json');

type Props = {
  /** True only during the ephemeral completion event, never on restored state. */
  play: boolean;
  onComplete?: () => void;
};

/**
 * Tiny, local and one-shot. All actual completion information stays in the
 * parent Text, so this icon is decorative and motion is never required.
 */
export function CompletionAnimation({ play, onComplete }: Props) {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => { if (mounted) setReduceMotion(reduced); })
      .catch(() => { if (mounted) setReduceMotion(true); });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduced) => {
      setReduceMotion(reduced);
    });
    return () => { mounted = false; motion.remove(); };
  }, []);

  useEffect(() => {
    if (!play) return;
    const appState = AppState.addEventListener('change', (state) => {
      // Do not start/replay an animation when returning from the background.
      if (state !== 'active') onComplete?.();
    });
    return () => appState.remove();
  }, [play, onComplete]);

  return (
    <View style={styles.wrap} accessible={false} importantForAccessibility="no-hide-descendants">
      {play && reduceMotion === false && AppState.currentState === 'active' ? (
        <LottieView
          source={COMPLETE_ANIMATION}
          autoPlay
          loop={false}
          onAnimationFinish={() => onComplete?.()}
          style={styles.animation}
          resizeMode="contain"
        />
      ) : (
        <Text style={styles.staticTick}>✓</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  animation: { width: 64, height: 64 },
  staticTick: { color: '#8FE0CD', fontSize: 38, fontWeight: '900' },
});
