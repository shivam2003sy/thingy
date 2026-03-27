// Icon mapping for MaterialCommunityIcons
export const ICON_MAP: Record<string, string> = {
  // Buyer personalities
  brain: 'brain',
  cart: 'cart',
  emoticon: 'emoticon-happy',
  dragon: 'dragon',
  
  // Items
  crown: 'crown',
  plushie: 'teddy-bear',
  sparkles: 'star-circle',
  fire: 'fire',
  rocket: 'rocket',
  gem: 'diamond-stone',
  trophy: 'trophy',
  gift: 'gift',
  star: 'star',
  heart: 'heart',
  lightning: 'lightning-bolt',
  money: 'cash',
  coin: 'coin',
  
  // Badges
  'certified-weird': 'star-circle',
  'chaos-starter': 'fire',
  'impulse-master': 'lightning-bolt',
  'collection-king': 'crown',
  
  // Actions
  check: 'check',
  close: 'close',
  plus: 'plus',
  minus: 'minus',
  home: 'home',
  shopping: 'shopping',
  account: 'account',
};

export const getIconName = (key: string): string => {
  return ICON_MAP[key] || 'help-circle';
};
