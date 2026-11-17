export function requiredPropertyTimeErrors(checkInTime: string, checkOutTime: string) {
  return {
    check_in_time: !checkInTime.trim(),
    check_out_time: !checkOutTime.trim(),
  };
}
