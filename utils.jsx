export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export function createPageUrl(pageName) {
    const [path, query] = pageName.split('?');
    const pageUrl = `/${path.replace(/ /g, '-').toLowerCase()}`;
    return query ? `${pageUrl}?${query}` : pageUrl;
}

export function formatTime(timeString) {
  if (!timeString || !/^\d{2}:\d{2}/.test(timeString)) return '';
  const [hour, minute] = timeString.split(':');
  const h = parseInt(hour, 10);
  const period = h >= 12 ? 'pm' : 'am';
  const adjustedHour = h % 12 || 12; // Converts "00" to 12am and "12" to 12pm
  return `${adjustedHour}:${minute}${period}`;
}