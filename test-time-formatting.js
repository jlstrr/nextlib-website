// Test script to verify time formatting function
import { formatMilitaryTimeToStandard } from './src/utils/timeUtils.js';

// Test cases
const testCases = [
  '08:00', // 8:00 AM
  '12:00', // 12:00 PM
  '13:30', // 1:30 PM
  '17:00', // 5:00 PM
  '00:00', // 12:00 AM
  '23:59', // 11:59 PM
  '09:15', // 9:15 AM
  '15:45', // 3:45 PM
];

console.log('Testing military time to standard time conversion:');
console.log('='.repeat(50));

testCases.forEach(militaryTime => {
  const standardTime = formatMilitaryTimeToStandard(militaryTime);
  console.log(`${militaryTime} -> ${standardTime}`);
});