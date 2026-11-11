"use client";

import css from "./BookingForm.module.css";
import { useId, useState, useSyncExternalStore } from "react";
import type { Location } from "@/types/location";
import type { SearchTablesParams } from "@/lib/api/clientApi";

type Props = {
  locations: Location[];
  initialLocationId?: string;
  isSearching: boolean;
  serverErrors: Errors;
  onSearch: (params: SearchTablesParams) => void;
};

export type Errors = {
  date?: string;
  time?: string;
  guests?: string;
};

// Ресторани в Тбілісі: «сьогодні» і «зараз» рахуємо за їхнім часом
const RESTAURANT_TIME_ZONE = "Asia/Tbilisi";

// Сітка бекенда: з 10:00 до 21:30 кожні 30 хвилин
const TIME_SLOTS = Array.from({ length: 24 }, (_, index) => {
  const minutes = 10 * 60 + index * 30;
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  return `${hours}:${minutes % 60 === 0 ? "00" : "30"}`;
});

// Столи на 2 і 4 особи; більші компанії — лише телефоном
const MAX_GUESTS = 4;

const getRestaurantNow = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESTAURANT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
};

const subscribe = () => () => {};

const BookingForm = ({
  locations,
  initialLocationId = "",
  isSearching,
  serverErrors,
  onSearch,
}: Props) => {
  const id = useId();

  const [locationId, setLocationId] = useState(initialLocationId);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(1);
  const [errors, setErrors] = useState<Errors>({});

  // «Сьогодні» відомо лише в браузері: на сервері інший час і пояс,
  // тож до гідрації не обмежуємо дати (інакше hydration mismatch)
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const now = isHydrated ? getRestaurantNow() : null;
  const isToday = now !== null && date === now.date;

  // Помилки з бекенда показуємо, поки користувач не змінив поле
  const shownErrors = { ...serverErrors, ...errors };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newErrors: Errors = {};

    if (!date) newErrors.date = "Choose date from the calendar";
    else if (now && date < now.date)
      newErrors.date = "This date has already passed";

    if (!time) newErrors.time = "Choose time slot";
    else if (isToday && now && time <= now.time)
      newErrors.time = "This time has already passed";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSearch({
      date,
      time,
      party_size: guests,
      location_id: locationId || undefined,
    });
  };

  return (
    <form className={css.form} onSubmit={handleSubmit} noValidate>
      <h1 className={css.title}>Book a Table</h1>

      <div className={css.field}>
        <label htmlFor={`${id}-location`} className={css.label}>
          Location
        </label>
        <select
          id={`${id}-location`}
          className={`${css.control} ${css.select}`}
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.address}
            </option>
          ))}
        </select>
      </div>

      <div className={css.field}>
        <label htmlFor={`${id}-date`} className={css.label}>
          Date
        </label>
        <input
          id={`${id}-date`}
          type="date"
          className={`${css.control} ${shownErrors.date ? css.controlError : ""}`}
          min={now?.date}
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setErrors((prev) => ({
              ...prev,
              date: undefined,
              time: undefined,
            }));
          }}
          aria-invalid={Boolean(shownErrors.date)}
          aria-describedby={shownErrors.date ? `${id}-date-error` : undefined}
        />
        {shownErrors.date && (
          <p id={`${id}-date-error`} className={css.error}>
            {shownErrors.date}
          </p>
        )}
      </div>

      <div className={css.row}>
        <div className={css.field}>
          <label htmlFor={`${id}-time`} className={css.label}>
            Time
          </label>
          <select
            id={`${id}-time`}
            className={`${css.control} ${css.select} ${time ? "" : css.placeholder} ${shownErrors.time ? css.controlError : ""}`}
            value={time}
            onChange={(event) => {
              setTime(event.target.value);
              setErrors((prev) => ({ ...prev, time: undefined }));
            }}
            aria-invalid={Boolean(shownErrors.time)}
            aria-describedby={shownErrors.time ? `${id}-time-error` : undefined}
          >
            <option value="" disabled>
              e.g. 10:00
            </option>
            {TIME_SLOTS.map((slot) => (
              <option
                key={slot}
                value={slot}
                // Сьогодні минулий час обрати не можна
                disabled={isToday && now !== null && slot <= now.time}
              >
                {slot}
              </option>
            ))}
          </select>
          {shownErrors.time && (
            <p id={`${id}-time-error`} className={css.error}>
              {shownErrors.time}
            </p>
          )}
        </div>

        <div className={css.field}>
          <span id={`${id}-guests`} className={css.label}>
            Guests
          </span>
          <div
            className={css.stepper}
            role="group"
            aria-labelledby={`${id}-guests`}
          >
            <button
              type="button"
              className={css.stepBtn}
              onClick={() => setGuests((prev) => prev - 1)}
              disabled={guests <= 1}
              aria-label="Fewer guests"
            >
              −
            </button>
            <output className={css.count} aria-live="polite">
              {guests}
            </output>
            <button
              type="button"
              className={css.stepBtn}
              onClick={() => setGuests((prev) => prev + 1)}
              disabled={guests >= MAX_GUESTS}
              aria-label="More guests"
            >
              +
            </button>
          </div>
          {shownErrors.guests && (
            <p className={css.error}>{shownErrors.guests}</p>
          )}
        </div>
      </div>

      <button type="submit" className={css.submit} disabled={isSearching}>
        {isSearching ? "Searching..." : "Find a Table"}
      </button>
    </form>
  );
};

export default BookingForm;
