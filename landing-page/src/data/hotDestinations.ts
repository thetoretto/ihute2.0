/** Hot destinations for the landing page (RideShare-style cards) */
export interface HotDestination {
  id: string;
  name: string;
  tagline: string;
  imageUrl: string;
  /** Hotpoint id for search (e.g. toId when clicking "from anywhere") */
  toId: string;
}

export const hotDestinations: HotDestination[] = [
  {
    id: 'kigali',
    name: 'Kigali',
    tagline: 'Daily Rides',
    imageUrl: 'https://images.unsplash.com/photo-1582575178548-8db8f43c2a2f?auto=format&fit=crop&q=80&w=800',
    toId: 'hp1',
  },
  {
    id: 'kampala',
    name: 'Kampala',
    tagline: 'Most Popular',
    imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=800',
    toId: 'hp5',
  },
  {
    id: 'goma',
    name: 'Goma',
    tagline: 'City Breaks',
    imageUrl: 'https://images.unsplash.com/photo-1484318571209-661cf29a69c3?auto=format&fit=crop&q=80&w=800',
    toId: 'hp4',
  },
  {
    id: 'rubavu',
    name: 'Rubavu',
    tagline: 'Weekend Special',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    toId: 'hp2',
  },
];
