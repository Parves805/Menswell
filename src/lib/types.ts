export interface Product {
  id: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: string;
  brand: string;
  images: string[];
  stock: number;
  tags: string[];
  sizes?: string[];
  colors?: { name: string; hex: string; image?: string; }[];
  createdAt?: string; // ISO date string
}

export interface Category {
  id: string;
  name: string;
  image: string;
  bannerImage: string;
  order?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: { name: string; hex: string };
}

export interface Order {
  id: string;
  date: string; // ISO Date String
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingInfo: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string; // Used for shipping location name e.g., 'Inside Dhaka'
    zip: string;
  };
  paymentDetails?: {
      method: string;
      transactionId?: string;
  };
}

export interface Review {
  id: string;
  productId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  timestamp: string; // ISO Date string
}

export interface PopupCampaign {
  enabled: boolean;
  imageUrl: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  displayDuration: number; // in seconds
}

export interface ShippingRate {
  id: string;
  location: string;
  cost: number;
}

export interface WebsiteSettings {
  storeName: string;
  logoUrl: string;
  footerLogoUrl?: string;
  tagline?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  shippingRates: ShippingRate[];
}

export interface AboutUsSettings {
    headline: string;
    subheadline: string;
    storyTitle: string;
    storyText: string;
    storyImageUrl: string;
    audienceTitle: string;
    audienceText: string;
    missionTitle: string;
    missionText1: string;
    missionText2: string;
}

export interface LegalPagesSettings {
    returns: string;
    terms: string;
    privacy: string;
}

export interface HomepageSection {
  id: string;
  title: string;
  mainImageUrl: string;
  categorySlug: string;
}

export interface PromoCard {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
}

export interface PromoSection {
    id: string;
    cards: PromoCard[];
}

export interface PaymentGatewaySettings {
  cashOnDelivery: boolean;
  bkash: boolean;
  bkashNumber: string;
  nagad: boolean;
  nagadNumber: string;
  rocket: boolean;
  rocketNumber: string;
}

export interface ThemeSettings {
    primary: string; // Now expecting HEX string e.g., "#RRGGBB"
    background: string; // Now expecting HEX string e.g., "#RRGGBB"
    accent: string; // Now expecting HEX string e.g., "#RRGGBB"
}

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  text: string;
  avatarUrl: string;
  rating: number;
}

export interface TestimonialsSettings {
    enabled: boolean;
    testimonials: Testimonial[];
}
