import { useEffect } from 'react';
import { matchesKeybinding } from '@/lib/keybinding';
import { useSettingsStore } from '@/stores/settings';

type KeybindingType = 'closeTab' | 'newTab' | 'nextTab' | 'prevTab' | 'clear';

/**
 * Intercept terminal keybindings when a condition is met.
 * Useful for dialogs/modals that need to capture close shortcuts.
 *
 * @param isActive - Whether to intercept keybindings
 * @param keybinding - Which keybinding to intercept
 * @param onMatch - Callback when the keybinding is pressed
 */
export function useKeybindingInterceptor(
  isActive: boolean,
  keybinding: KeybindingType,
  onMatch: () => void
) {
  const terminalKeybindings = useSettingsStore((s) => s.terminalKeybindings);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if a keybinding input is being recorded
      const activeElement = document.activeElement;
      if (activeElement?.hasAttribute('data-keybinding-recording')) {
        return;
      }

      const binding = terminalKeybindings[keybinding];
      if (matchesKeybinding(e, binding)) {
        e.preventDefault();
        e.stopPropagation();
        onMatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, keybinding, terminalKeybindings, onMatch]);
}
