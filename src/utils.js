export const fromNow = (date) => {
  let minutes = (new Date().getTime() - date.getTime()) / 1000 / 60;
  if (minutes < 1) return '< 1 minute'; // Added for better UX for very recent times
  if (minutes < 60) {
    return `${minutes.toFixed(0)} minutes`;
  }
  const hours = Math.floor(minutes / 60); // Use Math.floor for whole hours
  const remainingMinutes = Math.round(minutes % 60); // Use Math.round for remaining minutes
  if (hours < 24) {
    return `${hours} hours ${remainingMinutes} minutes`;
  }
  // Optional: Add days if needed
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days} days ${remainingHours} hours ${remainingMinutes} minutes`;
};