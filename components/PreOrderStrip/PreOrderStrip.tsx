"use client";

import css from "./PreOrderStrip.module.css";
import { usePreOrder } from "@/components/PreOrder/PreOrderProvider";
import { formatBookingDate, formatTimeRange } from "@/lib/utils/bookingTime";

// Зелена смуга під хедером, поки триває передзамовлення (як у Figma)
const PreOrderStrip = () => {
  const { session } = usePreOrder();
  if (!session) return null;

  const { location, table, starts_at, ends_at } = session;

  return (
    <div className={css.strip} role="status">
      <p className="container">
        You are making a pre-order for the reservation{" "}
        <strong>
          {location.address}, {table.label}, {formatBookingDate(starts_at)},{" "}
          {formatTimeRange(starts_at, ends_at)}
        </strong>
      </p>
    </div>
  );
};

export default PreOrderStrip;
