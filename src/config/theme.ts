export const T = {
  // Backgrounds
  bg: '#F4F6F9',
  card: '#FFFFFF',
  cardAlt: '#F8FAFC',

  // Brand
  primary: '#00C896',
  primaryLight: '#E6FBF5',
  primaryDark: '#00A67E',

  // Accents
  gold: '#F59E0B',
  goldLight: '#FEF3C7',
  live: '#EF4444',
  liveLight: '#FEE2E2',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  blue: '#3B82F6',

  // Text
  text: '#0F172A',
  textSec: '#64748B',
  textMuted: '#94A3B8',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Shadow helper
  shadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  } as const,

  shadowSm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  } as const,
};
