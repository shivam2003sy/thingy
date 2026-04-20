import { Product, User } from '../types';

export const MOCK_ITEMS: Product[] = [
  {
    id: '1',
    name: 'Cursed Banana',
    icon: '🍌',
    description: 'A banana that exists in multiple dimensions at once',
    price: 100,
    rarity: 'cursed',
  },
  {
    id: '2', 
    name: 'Rubber Chicken',
    icon: '🐔',
    description: 'The original meme. Never gets old.',
    price: 50,
    rarity: 'common',
  },
  {
    id: '3',
    name: 'Digital Brick',
    icon: '🧱',
    description: 'Why? Because why not.',
    price: 25,
    rarity: 'common',
  },
  {
    id: '4',
    name: 'Void Portal',
    icon: '🌀',
    description: 'Gateway to infinite chaos',
    price: 500,
    rarity: 'legendary',
  },
  {
    id: '5',
    name: 'Meme Crown',
    icon: '👑',
    description: 'For the ultimate meme lord',
    price: 1000,
    rarity: 'legendary',
  },
  {
    id: '6',
    name: 'Chaos Dice',
    icon: '🎲',
    description: 'Roll for chaos. Always rolls chaos.',
    price: 75,
    rarity: 'rare',
  },
];

export const MOCK_USERS: User[] = [
  {
    id: 'user1',
    username: 'ChaosKing',
    displayName: 'Chaos King',
    avatar: '👑',
    bio: 'Living in the chaos zone',
    level: 42,
    badges: ['viral', 'collector'],
    itemsOwned: 156,
  },
  {
    id: 'user2', 
    username: 'MemeLord',
    displayName: 'Meme Lord',
    avatar: '😎',
    bio: 'Professional memer',
    level: 38,
    badges: ['funny', 'trending'],
    itemsOwned: 89,
  },
  {
    id: 'user3',
    username: 'VoidWalker',
    displayName: 'Void Walker', 
    avatar: '🌌',
    bio: 'Seen things you wouldn\'t believe',
    level: 25,
    badges: ['mysterious'],
    itemsOwned: 234,
  },
];

export const TRENDING_ITEMS = [
  ...MOCK_ITEMS.slice(0, 3),
  {
    id: '7',
    name: 'Glitch Potato',
    icon: '🥔',
    description: 'This potato is experiencing technical difficulties',
    price: 150,
    rarity: 'rare',
  },
].sort((a, b) => (b.price || 0) - (a.price || 0));

export const VIRAL_CONTENT = [
  {
    id: 'viral1',
    userId: 'user1',
    itemId: '1',
    caption: 'My cursed banana just started speaking Latin 😱',
    reactions: { '😂': 234, '💀': 189, '🔥': 156 },
    shares: 89,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'viral2',
    userId: 'user2', 
    itemId: '5',
    caption: 'Finally achieved my dream of becoming Meme Royalty 👑',
    reactions: { '😂': 445, '💀': 234, '🔥': 378, '❤️': 123 },
    shares: 234,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'viral3',
    userId: 'user3',
    itemId: '4',
    caption: 'Accidentally opened a portal to the meme dimension',
    reactions: { '😂': 789, '💀': 456, '🔥': 678, '❤️': 234, '👑': 123 },
    shares: 567,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
];
