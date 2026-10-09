/**
 * Formats a date to a string in the format DD/MM/YYYY HH:MM:SS
 * @param date The date to format
 * @returns The formatted date
 */
export function formatDate(date: Date) {
  const paddedDay = date.getDate().toString().padStart(2, "0");
  const paddedMonth = (date.getMonth() + 1).toString().padStart(2, "0");
  const paddedHours = date.getHours().toString().padStart(2, "0");
  const paddedMinutes = date.getMinutes().toString().padStart(2, "0");
  const paddedSeconds = date.getSeconds().toString().padStart(2, "0");
  return `${paddedDay}/${paddedMonth}/${date.getFullYear()} ${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}
