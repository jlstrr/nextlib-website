/**
 * Time utilities for reservation system
 */

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  totalSeconds: number;
}

/**
 * Calculate time remaining until a target time
 */
export function getTimeUntil(targetTime: Date, currentTime: Date = new Date()): TimeRemaining | null {
  const timeDiff = targetTime.getTime() - currentTime.getTime();
  
  if (timeDiff <= 0) {
    return null; // Target time has passed
  }
  
  const totalSeconds = Math.floor(timeDiff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  
  return {
    hours,
    minutes,
    seconds,
    totalMinutes,
    totalSeconds
  };
}

/**
 * Format time remaining in human-readable format
 */
export function formatTimeRemaining(timeRemaining: TimeRemaining, includeSeconds: boolean = false): string {
  if (timeRemaining.hours > 0) {
    if (includeSeconds) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    }
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  } else if (timeRemaining.minutes > 0) {
    if (includeSeconds) {
      return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
    }
    return `${timeRemaining.minutes}m`;
  } else {
    return `${timeRemaining.seconds}s`;
  }
}

/**
 * Check if current time is within operating hours
 */
export function isWithinOperatingHours(
  currentTime: Date = new Date(),
  startHour: number = 8,
  endHour: number = 16,
  operatingDays: number[] = [1, 2, 3, 4, 5, 6] // Monday-Saturday
): { allowed: boolean; reason: string | null } {
  const currentHour = currentTime.getHours();
  const currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Check if it's an operating day
  if (!operatingDays.includes(currentDay)) {
    return { allowed: false, reason: "non_operating_day" };
  }
  
  // Check if before start hour
  if (currentHour < startHour) {
    return { allowed: false, reason: "too_early" };
  }
  
  // Check if after end hour
  if (currentHour >= endHour) {
    return { allowed: false, reason: "too_late" };
  }
  
  return { allowed: true, reason: null };
}

/**
 * Get the next opening time
 */
export function getNextOpeningTime(
  currentTime: Date = new Date(),
  startHour: number = 8,
  operatingDays: number[] = [1, 2, 3, 4, 5, 6]
): Date {
  const nextOpening = new Date(currentTime);
  nextOpening.setHours(startHour, 0, 0, 0);
  
  // If it's the same day and before opening time, return today's opening
  if (operatingDays.includes(currentTime.getDay()) && currentTime.getHours() < startHour) {
    return nextOpening;
  }
  
  // Otherwise, find the next operating day
  let daysToAdd = 1;
  while (daysToAdd <= 7) {
    const testDate = new Date(currentTime);
    testDate.setDate(testDate.getDate() + daysToAdd);
    
    if (operatingDays.includes(testDate.getDay())) {
      nextOpening.setDate(nextOpening.getDate() + daysToAdd);
      return nextOpening;
    }
    
    daysToAdd++;
  }
  
  // Fallback - should not happen with proper operating days
  nextOpening.setDate(nextOpening.getDate() + 1);
  return nextOpening;
}

/**
 * Create a real-time clock hook effect
 */
export function createClockEffect(
  updateCallback: (currentTime: Date) => void,
  intervalMs: number = 1000
): () => void {
  // Initial update
  updateCallback(new Date());
  
  // Set up interval
  const interval = setInterval(() => {
    updateCallback(new Date());
  }, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(interval);
}