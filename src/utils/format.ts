export function formatBytesToGB(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (!Number.isFinite(gb)) return '0.0';
  return gb.toFixed(gb >= 10 ? 1 : 2);
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getLocalDayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayKey(todayKey: string): string {
  const [year, month, day] = todayKey.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() - 1);
  return getLocalDayKey(date);
}

export function formatStreak(count: number): string {
  if (count <= 0) return 'No streak yet';
  if (count === 1) return '1-day streak';
  return `${count}-day streak`;
}
