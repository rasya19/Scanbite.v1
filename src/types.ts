export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'coffee' | 'non-coffee' | 'food' | 'dessert';
  image: string;
  rating: number;
  isPopular?: boolean;
  isOrganic?: boolean;
}

export interface CartItem {
  menuItemId: string;
  user: string; // Name of the person who ordered this item (useful for Split Bill!)
  quantity: number;
  notes?: string;
}

export interface TableSession {
  tableNumber: string;
  currentUser: string;
  roommates: string[]; // Other simulated people on the same table
  joinedAt: Date;
}

export interface JukeboxTrack {
  id: string;
  title: string;
  artist: string;
  requestedBy: string;
  votes: number;
  isPlaying?: boolean;
  duration: string;
  artworkUrl?: string;
  youtubeId?: string;
  spotifyUri?: string;
}

export interface CafeOrder {
  id: string;
  tableNumber: string;
  customerName: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    orderedBy: string;
  }[];
  totalPrice: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | string;
  sync_status?: 'pending' | 'synced';
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: string;
  sessionId?: string;
}

export interface UserBill {
  name: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  taxAndService: number;
  grandTotal: number;
  isPaid: boolean;
  payMethod?: string;
  pay_method?: string; // support snake_case synonym format
  cashAmount?: number;
  changeAmount?: number;
}
