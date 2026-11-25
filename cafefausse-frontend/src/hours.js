export function weekdayIndex(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function todayInEastern() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function nowMinutesEastern() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour").value);
  const minute = Number(parts.find((part) => part.type === "minute").value);
  return hour * 60 + minute;
}

function formatClock(hour, minute) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function timeChoices(dateStr) {
  if (!dateStr) {
    return [];
  }
  const sunday = weekdayIndex(dateStr) === 0;
  const end = sunday ? 20 * 60 + 30 : 22 * 60 + 30;
  const earliest = dateStr === todayInEastern() ? nowMinutesEastern() : -1;
  const choices = [];
  for (let minutes = 17 * 60; minutes <= end; minutes += 30) {
    if (minutes <= earliest) {
      continue;
    }
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    choices.push({
      value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      label: formatClock(hour, minute),
    });
  }
  return choices;
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
