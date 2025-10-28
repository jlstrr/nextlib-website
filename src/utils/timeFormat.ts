/**
 * Converts time string from "HH:MM:SS" format to human readable format
 * @param timeString - Time in format "HH:MM:SS" (e.g., "20:00:00")
 * @returns Human readable time string (e.g., "20 hours", "1 hour 30 minutes")
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  
  if (hours === 0 && minutes === 0 && seconds > 0) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }
  
  if (parts.length === 0) {
    return '0 minutes';
  }
  
  if (parts.length === 1) {
    return parts[0];
  }
  
  if (parts.length === 2) {
    return parts.join(' ');
  }
  
  // For cases with hours, minutes, and seconds, just show hours and minutes
  return parts.slice(0, 2).join(' ');
}