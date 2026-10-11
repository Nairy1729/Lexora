import { useEffect } from 'react';
import { Platform } from 'react-native';
import { processWebKeyboardEvent } from '../utils/webKeyboard';

export interface UseWebKeyboardOptions {
  onKeyPress: (key: string) => void;
  disabled?: boolean;
}

/**
 * Hook for capturing physical computer keyboard input on Web.
 * Automatically active only on web platform (`Platform.OS === 'web'`).
 * Cleans up listeners on unmount or when dependencies change.
 */
export function useWebKeyboard({
  onKeyPress,
  disabled = false,
}: UseWebKeyboardOptions): void {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    if (typeof window === 'undefined' || !window.addEventListener) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      processWebKeyboardEvent(event, onKeyPress, { disabled });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onKeyPress, disabled]);
}
