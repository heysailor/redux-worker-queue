export function getTimestamp(): number {
  return Math.floor(new Date().getTime() / 1000);
}
