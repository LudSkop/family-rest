"use client";

import css from "./PreOrderSubmitted.module.css";
import { useQuery } from "@tanstack/react-query";
import ButtonLink from "@/components/ButtonLink/ButtonLink";
import { usePreOrder } from "@/components/PreOrder/PreOrderProvider";
import { getMyPreOrder } from "@/lib/api/clientApi";
import { formatPrice } from "@/lib/utils/formatPrice";
import {
  formatBookingDate,
  formatPeople,
  formatTimeRange,
} from "@/lib/utils/bookingTime";

// «Pre-Order Submitted!» (Figma guest): показуємо останню відправлену частину.
// Дані беремо з бекенда (my-pre-order), тож сторінка переживає оновлення
const PreOrderSubmitted = () => {
  const { session } = usePreOrder();
  const bookingId = session?.bookingId;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings", bookingId, "my-pre-order"],
    queryFn: () => getMyPreOrder(bookingId!),
    enabled: Boolean(bookingId),
    retry: false,
  });

  const lastPart = data?.parts.at(-1);

  if (!session || isError || (data && !lastPart)) {
    return (
      <section className={css.page}>
        <div className={`container ${css.wrapper}`}>
          <div className={css.card}>
            <h1 className={css.title}>No pre-order to show</h1>
            <p className={css.lead}>
              We couldn&apos;t find a submitted pre-order for this reservation.
            </p>
            <ButtonLink href="/menu" variant="secondary">
              Go to Menu
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading || !lastPart) {
    return (
      <section className={css.page}>
        <p className={`container ${css.status}`}>Loading your pre-order...</p>
      </section>
    );
  }

  const ownerFirstName = session.ownerName.split(" ")[0] || "the host";

  const rows = [
    { label: "Restaurant", value: "Family Rest" },
    { label: "Location", value: session.location.address },
    { label: "Date", value: formatBookingDate(session.starts_at) },
    {
      label: "Time",
      value: formatTimeRange(session.starts_at, session.ends_at),
    },
    { label: "Guests", value: formatPeople(session.party_size) },
  ];

  return (
    <section className={css.page}>
      <div className={`container ${css.wrapper}`}>
        <div className={css.card}>
          <span className={css.check} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M6 12.5l4 4 8-9" />
            </svg>
          </span>

          <h1 className={css.title}>Pre-Order Submitted!</h1>
          <p className={css.lead}>
            Your selections have been added to {ownerFirstName}&apos;s table.
            <br />
            The restaurant will have everything ready for you.
          </p>

          <dl className={css.details}>
            {rows.map(({ label, value }) => (
              <div key={label} className={css.row}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className={css.itemsTitle}>Your items</h2>
          <ul className={css.items}>
            {lastPart.items.map((item) => (
              <li key={item.id} className={css.item}>
                <span>
                  {item.dish.name} × {item.quantity}
                </span>
                <span>{formatPrice(item.line_total_cents)}</span>
              </li>
            ))}
          </ul>

          <p className={css.total}>
            <span>Total</span>
            <strong>{formatPrice(lastPart.total_cents)}</strong>
          </p>

          {/* Бекенд уже залишив порожній кошик — можна збирати нове передзамовлення */}
          <ButtonLink href="/menu" variant="secondary">
            Create New Pre-Order
          </ButtonLink>
        </div>
      </div>
    </section>
  );
};

export default PreOrderSubmitted;
