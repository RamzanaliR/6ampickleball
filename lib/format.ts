const TIME_ZONE = "Africa/Dar_es_Salaam";

export function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatSessionTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** YYYY-MM-DD in Dar es Salaam local time, for <input type="date"> defaultValue */
export function toDarDateInputValue(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** HH:MM in Dar es Salaam local time, for <input type="time"> defaultValue */
export function toDarTimeInputValue(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("hour")}:${get("minute")}`;
}

/**
 * Combines a "YYYY-MM-DD" date and "HH:MM" time — both entered as Dar es
 * Salaam local time (EAT, UTC+3, no DST) — into a UTC ISO string for storage.
 */
export function darDateTimeToISO(date: string, time: string) {
  return new Date(`${date}T${time}:00+03:00`).toISOString();
}

export function formatTZS(amount: number) {
  return `TZS ${new Intl.NumberFormat("en-US").format(amount)}`;
}
