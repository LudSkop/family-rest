// Час бронювань бекенд віддає в поясі ресторану: "2026-10-17T12:00:00+04:00".
// Беремо дату й час із рядка як є, без перерахунку в пояс браузера

// → "12:00"
export const formatSlotTime = (dateTime: string) => dateTime.slice(11, 16);

// → "Oct 17, 2026"
export const formatBookingDate = (dateTime: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateTime.slice(0, 10)}T00:00:00Z`));

// → "12:00 – 14:00"
export const formatTimeRange = (startsAt: string, endsAt: string) =>
  `${formatSlotTime(startsAt)} – ${formatSlotTime(endsAt)}`;

// → "2 people"
export const formatPeople = (count: number) =>
  `${count} ${count === 1 ? "person" : "people"}`;
