export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'org_admin' | 'super_admin';
  avatar?: string;
  isEmailVerified: boolean;
  subscription?: Subscription;
  organization?: string | Organization;
  organizationRole?: 'member' | 'admin' | 'owner';
  department?: string;
  jobTitle?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  subdomain?: string;
  description?: string;
  logo?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
    };
  };
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
    customCSS?: string;
    customDomain?: string;
  };
  subscription?: {
    plan: 'free' | 'starter' | 'business' | 'enterprise';
    status: 'active' | 'trial' | 'cancelled' | 'expired';
    validUntil?: string;
  };
  limits?: {
    maxUsers: number;
    maxCards: number;
    maxProfiles: number;
    maxStorage: number;
  };
  usage?: {
    users: number;
    cards: number;
    profiles: number;
    storage: number;
  };
  settings?: {
    allowUserRegistration?: boolean;
    requireEmailVerification?: boolean;
    defaultUserRole?: string;
    twoFactorRequired?: boolean;
    allowCustomDomains?: boolean;
    features?: string[];
  };
  owner: string | User;
  admins?: string[] | User[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  features: {
    maxProfiles: number;
    maxCards: number;
    customDomain: boolean;
    analytics: boolean;
    premiumTemplates: boolean;
    removeWatermark: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    teamMembers: number;
  };
  usage: {
    profilesCreated: number;
    cardsActivated: number;
    monthlyViews: number;
    storageUsed: number;
  };
  currentPeriodEnd?: string;
}

export interface Profile {
  id: string;
  _id?: string; // MongoDB ID from backend
  user: string;
  slug: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    title?: string;
    company?: string;
    bio?: string;
    profilePhoto?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
    };
  };
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    tiktok?: string;
    custom?: Array<{
      platform: string;
      url: string;
      icon: string;
    }>;
  };
  businessHours?: Array<{
    day: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }>;
  template?: string | Template;
  customization: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logo?: string;
    backgroundImage?: string;
    customCSS?: string;
  };
  sections: {
    showContact: boolean;
    showSocial: boolean;
    showHours: boolean;
    showGallery: boolean;
    showServices: boolean;
    showTestimonials: boolean;
  };
  gallery?: Array<{
    url: string;
    caption?: string;
    order: number;
  }>;
  services?: Array<{
    title: string;
    description: string;
    price?: string;
    order: number;
  }>;
  testimonials?: Array<{
    name: string;
    company?: string;
    content: string;
    rating: number;
    date: string;
  }>;
  callToAction: {
    enabled: boolean;
    text: string;
    action: 'vcard' | 'email' | 'phone' | 'website' | 'custom';
    customUrl?: string;
  };
  analytics: {
    views: number;
    uniqueViews: number;
    cardTaps: number;
    contactDownloads: number;
    linkClicks: Record<string, number>;
  };
  qrCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  _id?: string; // MongoDB ID from backend
  name: string;
  slug: string;
  description?: string;
  category: 'corporate' | 'creative' | 'healthcare' | 'education' | 'technology' | 'retail' | 'hospitality' | 'other';
  thumbnail: string;
  previewUrl?: string;
  structure: {
    layout: 'centered' | 'left-aligned' | 'split' | 'card' | 'minimal';
    sections: Array<{
      id: string;
      type: string;
      order: number;
      config: any;
    }>;
  };
  defaultColors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  defaultFonts: {
    heading: string;
    body: string;
  };
  features: string[];
  isPremium: boolean;
  isActive: boolean;
  usageCount: number;
}

export interface Card {
  id: string;
  user: string;
  profile: string | Profile;
  cardId: string;
  chipType: 'NTAG213' | 'NTAG215' | 'NTAG216' | 'Other';
  serialNumber?: string;
  isActive: boolean;
  isWriteProtected: boolean;
  tapCount: number;
  lastTapped?: string;
  customUrl?: string;
  qrCodeUrl?: string;
  createdAt: string;
}

export interface Analytics {
  totalProfiles?: number;
  totalViews: number;
  uniqueVisitors: number;
  totalTaps: number;
  totalClicks?: number;
  totalShares?: number;
  totalDownloads?: number;
  deviceBreakdown?: Record<string, number>;
  sourceBreakdown?: Record<string, number>;
  topCountries?: Array<{
    country: string;
    count: number;
  }>;
  timeSeries?: Array<{
    _id: number;
    count: number;
  }>;
  profileBreakdown?: Array<{
    profileName: string;
    views: number;
    taps: number;
  }>;
  recentProfiles?: Array<{
    id: string;
    name: string;
    views: number;
    taps: number;
    status: string;
    lastUpdated: string;
    slug: string;
  }>;
  recentActivity?: Array<{
    id: string;
    type: string;
    message: string;
    time: string;
    profileName: string;
  }>;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  loading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}