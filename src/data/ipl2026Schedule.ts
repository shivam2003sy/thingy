export function formatMatchDate(dateTimeIST: string): string {
  const d = new Date(dateTimeIST);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatMatchTime(dateTimeIST: string): string {
  const d = new Date(dateTimeIST);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
