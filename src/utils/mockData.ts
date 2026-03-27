import { Product, LeaderboardUser, Personality, Badge, HookScreen } from '../types';

export const PERSONALITIES: Personality[] = [
  {
    id: 'smart',
    icon: 'brain',
    title: 'Smart but questionable',
    description: 'You research everything... then buy it anyway',
  },
  {
    id: 'unhinged',
    icon: 'cart',
    title: 'Unhinged spender',
    description: 'Cart first, think never',
  },
  {
    id: 'meme',
    icon: 'emoticon-happy',
    title: 'Meme lord',
    description: 'If it\'s not meme-worthy, it\'s not worth buying',
  },
  {
    id: 'collector',
    icon: 'shopping',
    title: 'Collector gremlin',
    description: 'Must. Have. Everything.',
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Mini Screaming Chicken',
    icon: 'bird',
    description: 'Screams when squeezed. Therapy not included.',
    price: 299,
    rarity: 'common',
  },
  {
    id: '2',
    name: 'Inflatable Crown',
    icon: 'crown',
    description: 'Rule your kingdom of chaos',
    price: 499,
    rarity: 'rare',
  },
  {
    id: '3',
    name: 'Glow-in-Dark Banana',
    icon: 'food-apple',
    description: 'Potassium that glows. Science!',
    price: 399,
    rarity: 'common',
  },
  {
    id: '4',
    name: 'Tiny Cowboy Hat',
    icon: 'hat-fedora',
    description: 'Yeehaw but make it tiny',
    price: 599,
    rarity: 'rare',
  },
  {
    id: '5',
    name: 'Screaming Banana',
    icon: 'food-apple',
    description: 'Like a regular banana but LOUDER',
    price: 799,
    rarity: 'legendary',
  },
  {
    id: '6',
    name: 'Golden Duck',
    icon: 'duck',
    description: 'Quack in style',
    price: 1299,
    rarity: 'legendary',
  },
  {
    id: '7',
    name: 'Disco Ball Egg',
    icon: 'egg',
    description: 'Party in your pocket',
    price: 449,
    rarity: 'rare',
  },
  {
    id: '8',
    name: 'Cursed Plushie',
    icon: 'teddy-bear',
    description: 'Definitely not haunted (probably)',
    price: 666,
    rarity: 'legendary',
  },
  {
    id: '9',
    name: 'RGB Socks',
    icon: 'shoe-sneaker',
    description: 'Your feet deserve gaming vibes',
    price: 349,
    rarity: 'common',
  },
  {
    id: '10',
    name: 'Pocket Void',
    icon: 'circle-outline',
    description: 'Stare into the abyss, portably',
    price: 999,
    rarity: 'legendary',
  },
  {
    id: '11',
    name: 'Anxiety Cube',
    icon: 'dice-6',
    description: 'Click, spin, regret',
    price: 299,
    rarity: 'common',
  },
  {
    id: '12',
    name: 'Motivational Rock',
    icon: 'stone',
    description: 'It believes in you',
    price: 199,
    rarity: 'common',
  },
];

export const MOCK_LEADERBOARD: LeaderboardUser[] = [
  {
    username: '@user123',
    action: 'bought',
    item: 'Screaming Banana',
    icon: 'food-apple',
  },
  {
    username: '@lolking',
    action: 'unlocked',
    item: 'Golden Duck',
    icon: 'duck',
  },
  {
    username: '@chaosqueen',
    action: 'flexing',
    item: 'Level 5',
    icon: 'crown',
  },
  {
    username: '@memegod',
    action: 'copped',
    item: 'Cursed Plushie',
    icon: 'teddy-bear',
  },
  {
    username: '@vibecheck',
    action: 'unlocked',
    item: 'Certified Weird',
    icon: 'star-circle',
  },
];

export const BADGES: Badge[] = [
  {
    id: 'certified-weird',
    name: 'Certified Weird',
    icon: 'star-circle',
    description: 'Made your first chaotic purchase',
  },
  {
    id: 'coin-collector',
    name: 'Coin Collector',
    icon: 'cash',
    description: 'Earned 1000 chaos coins',
  },
  {
    id: 'meme-master',
    name: 'Meme Master',
    icon: 'emoticon-happy',
    description: 'Shared 5 memes',
  },
  {
    id: 'chaos-starter',
    name: 'Chaos Starter',
    icon: 'fire',
    description: 'Completed onboarding',
  },
];

export const HOOK_SCREENS: HookScreen[] = [
  {
    id: 1,
    title: 'Your wallet called...\nit\'s scared',
    icon: 'cash-remove',
    gradient: ['#FF6B6B', '#4ECDC4'],
  },
  {
    id: 2,
    title: 'Shopping but make it\nunhinged',
    icon: 'cart',
    gradient: ['#A8E6CF', '#FFD3B6'],
  },
  {
    id: 3,
    title: 'Get ready for\nchaos mode',
    icon: 'target',
    gradient: ['#FF8B94', '#FFAAA5'],
  },
];

export const getRandomProduct = (): Product => {
  const randomIndex = Math.floor(Math.random() * MOCK_PRODUCTS.length);
  return MOCK_PRODUCTS[randomIndex];
};

export const calculateXPForLevel = (level: number): number => {
  return level * 100;
};

export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 100) + 1;
};
