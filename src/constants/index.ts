export const APP_CONSTANTS = {
  SPLASH_DURATION: 3000,
  ANIMATION_DURATION: {
    FAST: 300,
    NORMAL: 600,
    SLOW: 800,
  },
  BREAKPOINTS: {
    SMALL: 320,
    MEDIUM: 768,
    LARGE: 1024,
  },
} as const;

export const REACTIONS = ['😂', '💀', '🔥', '❤️', '👑', '🎭'] as const;

export const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6', 
  legendary: '#F59E0B',
  cursed: '#EF4444',
} as const;

export const TAB_ROUTES = {
  FEED: 'Feed',
  MARKETPLACE: 'Marketplace', 
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
} as const;
