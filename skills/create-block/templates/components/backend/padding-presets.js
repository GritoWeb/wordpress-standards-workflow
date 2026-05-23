/**
 * Global padding presets for all blocks.
 * Edit here to change presets across every block.
 */
export const PADDING_PRESETS = {
  vertical: {
    desktop: [
      { label: 'None', px: 0 },
      { label: 'Medium', px: 112 },
      { label: 'Large', px: 218 },
    ],
    mobile: [
      { label: 'None', px: 0 },
      { label: 'Medium', px: 56 },
      { label: 'Large', px: 96 },
    ],
  },
  /** Horizontal padding (px) applied when the toggle is ON, per breakpoint. */
  horizontal: {
    desktop: 96,
    mobile: 20,
  },
};
