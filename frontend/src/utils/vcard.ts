import { Profile } from '../types';

/**
 * Formats business hours for vCard NOTE field
 */
const formatBusinessHoursForVCard = (businessHours: Array<{
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}>): string => {
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  return businessHours
    .sort((a, b) => daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day))
    .map(hour => {
      if (!hour.isOpen) {
        return `${hour.day}: Closed`;
      }
      if (hour.openTime && hour.closeTime) {
        return `${hour.day}: ${hour.openTime} - ${hour.closeTime}`;
      }
      return `${hour.day}: Open`;
    })
    .join('\n');
};

export interface VCardData {
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  bio?: string;
  profilePhoto?: string;
  businessHours?: Array<{
    day: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }>;
}

/**
 * Escapes special characters in vCard values
 */
const escapeVCardValue = (value: string | undefined): string => {
  if (!value) return '';
  return value.toString()
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
};

/**
 * Generates a vCard (VCF) string from profile data
 * vCard 3.0 format for maximum compatibility
 */
export const generateVCard = (data: VCardData): string => {
  const lines: string[] = [];
  
  // vCard header
  lines.push('BEGIN:VCARD');
  lines.push('VERSION:3.0');
  
  // Name fields
  const fullName = `${escapeVCardValue(data.firstName)} ${escapeVCardValue(data.lastName)}`.trim();
  lines.push(`FN:${fullName}`);
  lines.push(`N:${escapeVCardValue(data.lastName)};${escapeVCardValue(data.firstName)};;;`);
  
  // Title and organization
  if (data.title) {
    lines.push(`TITLE:${escapeVCardValue(data.title)}`);
  }
  
  if (data.company) {
    lines.push(`ORG:${escapeVCardValue(data.company)}`);
  }
  
  // Contact information
  if (data.phone) {
    // Clean phone number and add tel: prefix if not present
    const cleanPhone = data.phone.replace(/[^\d+()-\s]/g, '');
    lines.push(`TEL;TYPE=CELL:${cleanPhone}`);
    lines.push(`TEL;TYPE=WORK:${cleanPhone}`);
  }
  
  if (data.email) {
    lines.push(`EMAIL;TYPE=WORK:${escapeVCardValue(data.email)}`);
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(data.email)}`);
  }
  
  if (data.website) {
    // Ensure website has protocol
    const website = data.website.startsWith('http') ? data.website : `https://${data.website}`;
    lines.push(`URL:${website}`);
  }
  
  // Address
  if (data.address && (data.address.street || data.address.city || data.address.state || data.address.country)) {
    const addressParts = [
      '', // Post office box (empty)
      '', // Extended address (empty)
      data.address.street || '',
      data.address.city || '',
      data.address.state || '',
      data.address.postalCode || '',
      data.address.country || ''
    ];
    lines.push(`ADR;TYPE=WORK:${addressParts.join(';')}`);
  }
  
  // Bio/Note with business hours
  let noteContent = data.bio || '';
  
  // Add business hours to note if available
  if (data.businessHours && data.businessHours.length > 0) {
    const hoursText = formatBusinessHoursForVCard(data.businessHours);
    if (hoursText) {
      noteContent = noteContent ? `${noteContent}\n\nBusiness Hours:\n${hoursText}` : `Business Hours:\n${hoursText}`;
    }
  }
  
  if (noteContent) {
    lines.push(`NOTE:${escapeVCardValue(noteContent)}`);
  }
  
  // Photo (if it's a base64 string)
  if (data.profilePhoto && data.profilePhoto.startsWith('data:image')) {
    const photoData = data.profilePhoto.split(',')[1]; // Remove data:image/jpeg;base64, prefix
    const mimeType = data.profilePhoto.split(';')[0].split(':')[1]; // Extract mime type
    lines.push(`PHOTO;ENCODING=BASE64;TYPE=${mimeType}:${photoData}`);
  }
  
  // Timestamp
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  lines.push(`REV:${now}`);
  
  // vCard footer
  lines.push('END:VCARD');
  
  return lines.join('\r\n');
};

/**
 * Creates and downloads a vCard file
 */
export const downloadVCard = (data: VCardData): void => {
  const vCardContent = generateVCard(data);
  const fileName = `${data.firstName}_${data.lastName}.vcf`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  
  // Create blob and download
  const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Creates a data URL for vCard content
 * Useful for iOS devices where direct download might not work
 */
export const createVCardDataUrl = (data: VCardData): string => {
  const vCardContent = generateVCard(data);
  const base64 = btoa(unescape(encodeURIComponent(vCardContent)));
  return `data:text/vcard;base64,${base64}`;
};

/**
 * Converts Profile data to VCard format
 */
export const profileToVCard = (profile: Profile): VCardData => {
  return {
    firstName: profile.personalInfo.firstName,
    lastName: profile.personalInfo.lastName,
    title: profile.personalInfo.title,
    company: profile.personalInfo.company,
    phone: profile.contactInfo.phone,
    email: profile.contactInfo.email,
    website: profile.contactInfo.website,
    address: profile.contactInfo.address,
    bio: profile.personalInfo.bio,
    profilePhoto: profile.personalInfo.profilePhoto,
    businessHours: profile.businessHours,
  };
};

/**
 * Checks if the device supports vCard downloads
 */
export const isVCardSupported = (): boolean => {
  // Most modern browsers support blob downloads
  return typeof window !== 'undefined' && 
         typeof window.URL !== 'undefined' && 
         typeof window.URL.createObjectURL !== 'undefined';
};

/**
 * Gets platform-specific instructions for saving contacts
 */
export const getContactSaveInstructions = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'The contact file will be downloaded. Open it to add to your iPhone contacts.';
  } else if (userAgent.includes('android')) {
    return 'The contact file will be downloaded. Open it to add to your Android contacts.';
  } else if (userAgent.includes('mac')) {
    return 'The contact file will be downloaded. Double-click to add to your Mac contacts.';
  } else if (userAgent.includes('windows')) {
    return 'The contact file will be downloaded. Open it to add to your Windows contacts.';
  } else {
    return 'The contact file will be downloaded. Open it to add to your contacts app.';
  }
};