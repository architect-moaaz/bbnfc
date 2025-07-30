export interface BusinessHour {
  day: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

/**
 * Days of the week in order (lowercase to match backend enum)
 */
export const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Display names for days (capitalized for UI)
 */
export const DAYS_DISPLAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Sorts business hours by day of the week
 */
export const sortBusinessHours = (businessHours: BusinessHour[]): BusinessHour[] => {
  return businessHours.sort((a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day));
};

/**
 * Formats business hours for display
 */
export const formatBusinessHour = (hour: BusinessHour): string => {
  if (!hour.isOpen) {
    return 'Closed';
  }
  if (hour.openTime && hour.closeTime) {
    return `${hour.openTime} – ${hour.closeTime}`;
  }
  return 'Open';
};

/**
 * Groups consecutive days with the same hours
 */
export const groupBusinessHours = (businessHours: BusinessHour[]): Array<{
  days: string;
  hours: string;
}> => {
  const sortedHours = sortBusinessHours(businessHours);
  const grouped: Array<{ days: string; hours: string }> = [];
  
  let currentGroup: BusinessHour[] = [];
  let currentHours = '';
  
  for (const hour of sortedHours) {
    const formattedHour = formatBusinessHour(hour);
    
    if (formattedHour === currentHours && currentGroup.length > 0) {
      // Same hours, add to current group
      currentGroup.push(hour);
    } else {
      // Different hours, finalize current group and start new one
      if (currentGroup.length > 0) {
        grouped.push({
          days: formatDayRange(currentGroup),
          hours: currentHours
        });
      }
      currentGroup = [hour];
      currentHours = formattedHour;
    }
  }
  
  // Don't forget the last group
  if (currentGroup.length > 0) {
    grouped.push({
      days: formatDayRange(currentGroup),
      hours: currentHours
    });
  }
  
  return grouped;
};

/**
 * Formats a range of days (e.g., "Mon - Fri" or "Saturday")
 */
const formatDayRange = (days: BusinessHour[]): string => {
  if (days.length === 1) {
    // Capitalize first letter for display
    return days[0].day.charAt(0).toUpperCase() + days[0].day.slice(1);
  }
  
  // Check if it's a consecutive range
  const dayIndices = days.map(d => DAYS_ORDER.indexOf(d.day)).sort((a, b) => a - b);
  const isConsecutive = dayIndices.every((index, i) => i === 0 || index === dayIndices[i - 1] + 1);
  
  if (isConsecutive && days.length > 1) {
    const firstDay = days[0].day.charAt(0).toUpperCase() + days[0].day.slice(1);
    const lastDay = days[days.length - 1].day.charAt(0).toUpperCase() + days[days.length - 1].day.slice(1);
    return `${firstDay} - ${lastDay}`;
  }
  
  // Not consecutive, list all days
  return days.map(d => d.day.charAt(0).toUpperCase() + d.day.slice(1)).join(', ');
};

/**
 * Gets the current day's business hours
 */
export const getTodaysHours = (businessHours: BusinessHour[]): BusinessHour | null => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  return businessHours.find(hour => hour.day === today) || null;
};

/**
 * Checks if business is currently open
 */
export const isCurrentlyOpen = (businessHour: BusinessHour | null): boolean => {
  if (!businessHour || !businessHour.isOpen || !businessHour.openTime || !businessHour.closeTime) {
    return false;
  }
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  return currentTime >= businessHour.openTime && currentTime <= businessHour.closeTime;
};

/**
 * Gets a readable status for current business hours
 */
export const getBusinessStatus = (businessHours: BusinessHour[]): {
  isOpen: boolean;
  message: string;
} => {
  const todaysHours = getTodaysHours(businessHours);
  
  if (!todaysHours) {
    return { isOpen: false, message: 'Hours not available' };
  }
  
  if (!todaysHours.isOpen) {
    return { isOpen: false, message: 'Closed today' };
  }
  
  const isOpen = isCurrentlyOpen(todaysHours);
  
  if (isOpen) {
    return { 
      isOpen: true, 
      message: `Open until ${todaysHours.closeTime}` 
    };
  }
  
  return { 
    isOpen: false, 
    message: todaysHours.openTime ? `Opens at ${todaysHours.openTime}` : 'Closed' 
  };
};