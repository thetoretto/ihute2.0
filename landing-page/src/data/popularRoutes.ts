/** Popular route cards for BlaBlaCar-style "best prices" section */
export interface RouteFromCity {
  id: string;
  name: string;
  price: string;
}

export interface PopularRoute {
  toId: string;
  toName: string;
  fromId: string;
  fromName: string;
  /** Lowest price for "From X" badge (e.g. "From 8,500 RWF") */
  fromPrice: string;
  /** Image URL for card (placeholder or asset) */
  imageUrl: string;
  fromCities: RouteFromCity[];
}

/** Placeholder images per route (picsum with seed for variety) */
const img = (seed: string) => `https://picsum.photos/seed/${seed}/400/200`;

export const popularRoutes: PopularRoute[] = [
  {
    fromId: 'hp1',
    fromName: 'Kigali',
    toId: 'hp2',
    toName: 'Rubavu',
    fromPrice: '8,500 RWF',
    imageUrl: img('kigali-rubavu'),
    fromCities: [
      { id: 'hp5', name: 'Kampala', price: '25,900 RWF' },
      { id: 'hp4', name: 'Goma', price: '31,500 RWF' },
      { id: 'hp6', name: 'Musanze', price: '8,500 RWF' },
      { id: 'hp9', name: 'Bujumbura', price: '22,000 RWF' },
    ],
  },
  {
    fromId: 'hp2',
    fromName: 'Rubavu',
    toId: 'hp1',
    toName: 'Kigali',
    fromPrice: '8,500 RWF',
    imageUrl: img('rubavu-kigali'),
    fromCities: [
      { id: 'hp4', name: 'Goma', price: '31,500 RWF' },
      { id: 'hp6', name: 'Musanze', price: '8,500 RWF' },
      { id: 'hp9', name: 'Bujumbura', price: '28,000 RWF' },
      { id: 'hp10', name: 'Kabale', price: '12,000 RWF' },
    ],
  },
  {
    fromId: 'hp1',
    fromName: 'Kigali',
    toId: 'hp5',
    toName: 'Kampala',
    fromPrice: '15,000 RWF',
    imageUrl: img('kigali-kampala'),
    fromCities: [
      { id: 'hp2', name: 'Rubavu', price: '25,500 RWF' },
      { id: 'hp6', name: 'Musanze', price: '30,000 RWF' },
      { id: 'hp9', name: 'Bujumbura', price: '35,000 RWF' },
      { id: 'hp10', name: 'Kabale', price: '15,000 RWF' },
    ],
  },
  {
    fromId: 'hp5',
    fromName: 'Kampala',
    toId: 'hp1',
    toName: 'Kigali',
    fromPrice: '15,000 RWF',
    imageUrl: img('kampala-kigali'),
    fromCities: [
      { id: 'hp10', name: 'Kabale', price: '15,000 RWF' },
      { id: 'hp2', name: 'Rubavu', price: '28,000 RWF' },
      { id: 'hp6', name: 'Musanze', price: '32,000 RWF' },
      { id: 'hp9', name: 'Bujumbura', price: '38,000 RWF' },
    ],
  },
  {
    fromId: 'hp1',
    fromName: 'Kigali',
    toId: 'hp4',
    toName: 'Goma',
    fromPrice: '12,000 RWF',
    imageUrl: img('kigali-goma'),
    fromCities: [
      { id: 'hp2', name: 'Rubavu', price: '12,000 RWF' },
      { id: 'hp6', name: 'Musanze', price: '18,000 RWF' },
      { id: 'hp5', name: 'Kampala', price: '35,000 RWF' },
      { id: 'hp9', name: 'Bujumbura', price: '30,000 RWF' },
    ],
  },
  {
    fromId: 'hp4',
    fromName: 'Goma',
    toId: 'hp1',
    toName: 'Kigali',
    fromPrice: '12,000 RWF',
    imageUrl: img('goma-kigali'),
    fromCities: [
      { id: 'hp2', name: 'Rubavu', price: '12,000 RWF' },
      { id: 'hp6', name: 'Musanze', price: '18,000 RWF' },
      { id: 'hp5', name: 'Kampala', price: '38,000 RWF' },
      { id: 'hp9', name: 'Bujumbura', price: '32,000 RWF' },
    ],
  },
];
