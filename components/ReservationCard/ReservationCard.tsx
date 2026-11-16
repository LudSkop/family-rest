"use client";

import css from "./ReservationCard.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import InviteLinkModal from "@/components/InviteLinkModal/InviteLinkModal";
import GroupPreOrderModal from "@/components/GroupPreOrderModal/GroupPreOrderModal";
import {
  toPreOrderSession,
  usePreOrder,
} from "@/components/PreOrder/PreOrderProvider";
import { getMyPreOrder } from "@/lib/api/clientApi";
import { formatBookingDate, formatTimeRange } from "@/lib/utils/bookingTime";
import {
  STATUS_LABELS,
  type ReservationStatus,
} from "@/lib/utils/bookingStatus";
import type { Booking } from "@/types/booking";

type Props = {
  booking: Booking;
  status: ReservationStatus;
  onCancel: (booking: Booking) => void;
};

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={css.icon}>
    <path d={d} />
  </svg>
);

const ICONS = {
  pin: "M12 21s-7-6.1-7-11.5a7 7 0 1 1 14 0C19 14.9 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  guests:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3 6",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
};

// Картка бронювання (Figma «Reservations»): статус зверху, адреса, дата, час, гості
const ReservationCard = ({ booking, status, onCancel }: Props) => {
  const router = useRouter();
  const { startPreOrder } = usePreOrder();
  const [openModal, setOpenModal] = useState<"invite" | "group" | null>(null);

  const isOwner = booking.role === "OWNER";
  const isUpcoming = status === "RESERVED";
  // Запит ще не підтвердили: скасувати й запросити можна, передзамовлення — ні
  const isPending = status === "PENDING";
  const canManage = isOwner && (isUpcoming || isPending);

  // «1 Guest = Owner»: запрошувати нікого — блоку «Invite Guests» немає (Figma)
  const canInvite = isOwner && isUpcoming && booking.party_size > 1;

  // Чи вже відправляв цей учасник своє передзамовлення:
  // ні — «Add Pre-Order», так — «Group Pre-Order» (Figma)
  const { data: myPreOrder } = useQuery({
    queryKey: ["bookings", booking.id, "my-pre-order"],
    queryFn: () => getMyPreOrder(booking.id),
    enabled: isUpcoming,
    retry: false,
  });
  const hasSubmitted = Boolean(myPreOrder?.parts.length);

  const addPreOrder = () => {
    startPreOrder(toPreOrderSession(booking));
    router.push("/menu");
  };

  return (
    <article className={`${css.card} ${css[status]}`}>
      <p className={css.status}>{STATUS_LABELS[status]}</p>

      <div className={css.body}>
        <div className={css.head}>
          <h2 className={css.address}>
            <Icon d={ICONS.pin} />
            {booking.location.address}
          </h2>

          {/* Скасувати може лише власник і лише майбутнє бронювання */}
          {canManage && (
            <button
              type="button"
              className={css.trash}
              onClick={() => onCancel(booking)}
              aria-label="Cancel reservation"
            >
              <Icon d={ICONS.trash} />
            </button>
          )}
        </div>

        {/* Код запрошення бекенд дає лише для підтвердженого бронювання */}
        {canInvite && (
          <div className={css.invite}>
            <p>
              Share link with your guests so they can place their pre-orders
            </p>
            <button
              type="button"
              className={css.outlineBtn}
              onClick={() => setOpenModal("invite")}
            >
              Invite Guests
            </button>
          </div>
        )}

        <dl className={css.details}>
          <div>
            <dt className="visually-hidden">Date</dt>
            <dd>
              <Icon d={ICONS.calendar} />
              {formatBookingDate(booking.starts_at)}
            </dd>
          </div>
          <div>
            <dt className="visually-hidden">Guests</dt>
            <dd>
              <Icon d={ICONS.guests} />
              {booking.party_size}{" "}
              {booking.party_size === 1 ? "Guest" : "Guests"}
            </dd>
          </div>
          <div>
            <dt className="visually-hidden">Time</dt>
            <dd>
              <Icon d={ICONS.clock} />
              {formatTimeRange(booking.starts_at, booking.ends_at)}
            </dd>
          </div>
          <div>
            <dt className="visually-hidden">Table</dt>
            <dd className={css.table}>{booking.table.label}</dd>
          </div>
        </dl>

        {/* TODO: «Pre-orders: 4/4» і замовлення гостей у Group Pre-Order —
            чекають API бекенда */}
        {isPending && (
          <p className={css.pendingNote}>
            The restaurant will confirm your request soon. Pre-ordering opens
            after confirmation.
          </p>
        )}

        {isUpcoming && (
          <div className={css.actions}>
            {hasSubmitted ? (
              <button
                type="button"
                className={css.outlineBtn}
                onClick={() => setOpenModal("group")}
              >
                Group Pre-Order
              </button>
            ) : (
              <button
                type="button"
                className={css.primaryBtn}
                onClick={addPreOrder}
              >
                Add Pre-Order
              </button>
            )}
          </div>
        )}
      </div>

      {openModal === "invite" && (
        <InviteLinkModal booking={booking} onClose={() => setOpenModal(null)} />
      )}

      {openModal === "group" && myPreOrder && (
        <GroupPreOrderModal
          booking={booking}
          preOrder={myPreOrder}
          onAddMore={addPreOrder}
          onClose={() => setOpenModal(null)}
        />
      )}
    </article>
  );
};

export default ReservationCard;
