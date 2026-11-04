export function isPackageBooking(booking: { package_id: string | null; message: string | null }) {
  return Boolean(booking.package_id) || Boolean(booking.message?.startsWith("ՓԱՏԵԹ:"));
}