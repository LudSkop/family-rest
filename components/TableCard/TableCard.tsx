import css from "./TableCard.module.css";
import Image from "next/image";
import type { BookingTable, TableSlot } from "@/types/booking";

type Props = {
  table: BookingTable;
  onSelect: (table: BookingTable, slot: TableSlot) => void;
  isBooking: boolean;
};

// "2026-11-12T10:00:00+04:00" → "10:00" (час ресторану, без перерахунку поясу)
const slotTime = (startsAt: string) => startsAt.slice(11, 16);

// Картка столу з Figma: фото локації, назва, місткість, адреса
// і вся сітка дня (вільні — зелені, зайняті — сірі)
const TableCard = ({ table, onSelect, isBooking }: Props) => {
  const { label, capacity, location, slots } = table;

  return (
    <article className={css.card}>
      <div className={css.imageWrapper}>
        <Image
          src={location.image_url}
          alt=""
          fill
          sizes="(min-width: 1440px) 400px, (min-width: 768px) 50vw, 100vw"
          className={css.image}
        />
      </div>

      <div className={css.body}>
        <div className={css.head}>
          <h3 className={css.label}>{label}</h3>
          <p className={css.capacity}>Up to {capacity} guests</p>
        </div>
        <p className={css.address}>{location.address}</p>

        <ul className={css.slots} aria-label={`Start times for ${label}`}>
          {slots.map((slot) => (
            <li key={slot.starts_at}>
              {/* Вільний час — кнопка «забронювати», зайнятий — просто текст */}
              {slot.available ? (
                <button
                  type="button"
                  className={`${css.slot} ${css.free}`}
                  onClick={() => onSelect(table, slot)}
                  disabled={isBooking}
                  aria-label={`Book ${label} at ${slotTime(slot.starts_at)}`}
                >
                  {slotTime(slot.starts_at)}
                </button>
              ) : (
                <span className={`${css.slot} ${css.taken}`}>
                  {slotTime(slot.starts_at)}
                  <span className="visually-hidden"> (booked)</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};

export default TableCard;
