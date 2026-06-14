// Tiny pub/sub bridge so any component (e.g. the Header trigger) can open the
// global command palette without prop-drilling or a context provider.

export const COMMAND_PALETTE_OPEN = 'command-palette:open';

export function openCommandPalette() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN));
  }
}
