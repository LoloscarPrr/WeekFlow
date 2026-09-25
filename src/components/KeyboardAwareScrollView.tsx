import { createContext, forwardRef, useCallback, useContext, useEffect, useRef } from 'react';
import { Keyboard, ScrollView, TextInput, type ScrollViewProps, type TextInputProps } from 'react-native';
import { keyboardVisibleOffset } from '@/src/presentation/layout/keyboardVisibility';

const FieldContext = createContext<{
  focus: (field: TextInput) => void;
  blur: (field: TextInput) => void;
  layout: (field: TextInput) => void;
} | null>(null);

export const KeyboardAwareScrollView = forwardRef<ScrollView, ScrollViewProps>(
  function KeyboardAwareScrollView({ children, onLayout, onContentSizeChange, onScroll, onScrollBeginDrag, ...props }, forwardedRef) {
    const scroll = useRef<ScrollView | null>(null);
    const focused = useRef<TextInput | null>(null);
    const offset = useRef(0);
    const contentHeight = useRef(0);
    const keyboardTop = useRef<number | null>(null);
    const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
    const generation = useRef(0);

    const cancel = useCallback(() => {
      generation.current += 1;
      if (pending.current !== null) clearTimeout(pending.current);
      pending.current = null;
    }, []);

    const reveal = useCallback(() => {
      cancel();
      if (!focused.current || keyboardTop.current === null) return;
      const token = generation.current;
      // Let resize, KeyboardAvoidingView and the bottom navigation finish layout.
      pending.current = setTimeout(() => {
        pending.current = null;
        const field = focused.current;
        const view = scroll.current;
        if (!field || !view || keyboardTop.current === null) return;
        const valid = () => generation.current === token && focused.current === field
          && scroll.current === view && keyboardTop.current !== null;
        view.getNativeScrollRef()?.measureInWindow((_x, viewportTop, _width, viewportHeight) => {
          if (!valid()) return;
          field.measureInWindow((_fx, fieldTop, _fw, fieldHeight) => {
            if (!valid()) return;
            const next = keyboardVisibleOffset({
              fieldTop, fieldHeight, viewportTop, viewportHeight,
              keyboardTop: keyboardTop.current!, offset: offset.current,
              contentHeight: contentHeight.current,
            });
            if (Math.abs(next - offset.current) < 1) return;
            offset.current = next;
            view.scrollTo({ y: next, animated: false });
          });
        });
      }, 80);
    }, [cancel]);

    useEffect(() => {
      const show = Keyboard.addListener('keyboardDidShow', (event) => {
        keyboardTop.current = event.endCoordinates.screenY;
        reveal();
      });
      const frame = Keyboard.addListener('keyboardDidChangeFrame', (event) => {
        if (!Keyboard.isVisible()) return;
        keyboardTop.current = event.endCoordinates.screenY;
        reveal();
      });
      const hide = Keyboard.addListener('keyboardDidHide', () => {
        keyboardTop.current = null;
        cancel();
      });
      return () => { show.remove(); frame.remove(); hide.remove(); cancel(); };
    }, [cancel, reveal]);

    const attach = useCallback((value: ScrollView | null) => {
      scroll.current = value;
      if (typeof forwardedRef === 'function') forwardedRef(value);
      else if (forwardedRef) forwardedRef.current = value;
    }, [forwardedRef]);

    return (
      <FieldContext.Provider value={{
        focus: (field) => {
          focused.current = field;
          keyboardTop.current = Keyboard.metrics()?.screenY ?? null;
          reveal();
        },
        blur: (field) => {
          if (focused.current !== field) return;
          focused.current = null;
          cancel();
        },
        layout: (field) => { if (focused.current === field) reveal(); },
      }}>
        <ScrollView
          {...props}
          ref={attach}
          scrollEventThrottle={16}
          onLayout={(event) => { onLayout?.(event); reveal(); }}
          onContentSizeChange={(width, height) => {
            contentHeight.current = height;
            onContentSizeChange?.(width, height);
            reveal();
          }}
          onScroll={(event) => { offset.current = event.nativeEvent.contentOffset.y; onScroll?.(event); }}
          onScrollBeginDrag={(event) => { cancel(); onScrollBeginDrag?.(event); }}
        >
          {children}
        </ScrollView>
      </FieldContext.Provider>
    );
  },
);

/** Preserve the native input instance, selection, events and forwarded ref. */
export const KeyboardAwareTextInput = forwardRef<TextInput, TextInputProps>(
  function KeyboardAwareTextInput({ onFocus, onBlur, onLayout, ...props }, forwardedRef) {
    const owner = useContext(FieldContext);
    const ownerRef = useRef(owner);
    ownerRef.current = owner;
    const field = useRef<TextInput | null>(null);
    const attach = useCallback((value: TextInput | null) => {
      if (!value && field.current) ownerRef.current?.blur(field.current);
      field.current = value;
      if (typeof forwardedRef === 'function') forwardedRef(value);
      else if (forwardedRef) forwardedRef.current = value;
    }, [forwardedRef]);
    return <TextInput
      {...props}
      ref={attach}
      onFocus={(event) => { if (field.current) owner?.focus(field.current); onFocus?.(event); }}
      onBlur={(event) => { if (field.current) owner?.blur(field.current); onBlur?.(event); }}
      onLayout={(event) => { if (field.current) owner?.layout(field.current); onLayout?.(event); }}
    />;
  },
);
