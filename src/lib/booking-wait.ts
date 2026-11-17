export function bookingWaitDuration(createdAt: string, now: Date = new Date()) {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return "";
  const minutes = Math.max(0, Math.floor((now.getTime() - created) / 60_000));
  if (minutes < 1) return "հենց հիմա";
  if (minutes < 60) return `${minutes} րոպե`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ժամ`;
  return `${Math.floor(hours / 24)} օր`;
}
