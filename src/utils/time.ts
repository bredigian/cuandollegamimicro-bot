export type Time = `${string}:${string}`;

export const isValidTime = (time: Time) => {
  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) return false;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return false;

  return true;
};
