"use client";

import css from "./Reservations.module.css";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ButtonLink from "@/components/ButtonLink/ButtonLink";
import ReservationCard from "@/components/ReservationCard/ReservationCard";
import CancelBookingModal from "@/components/CancelBookingModal/CancelBookingModal";
import { useToast } from "@/components/Toast/ToastProvider";
import { cancelBooking, getApiError, getBookings } from "@/lib/api/clientApi";
import {
  getReservationStatus,
  type ReservationStatus,
} from "@/lib/utils/bookingStatus";
import type { Booking } from "@/types/booking";

const SUPPORT_PHONE = "+123 445 678 8990";

type Tab = "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";

const TABS: { value: Tab; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const matchesTab = (tab: Tab, status: ReservationStatus) => {
  if (tab === "ALL") return true;
  if (tab === "UPCOMING")
    return (
      status === "RESERVED" || status === "IN_PROGRESS" || status === "PENDING"
    );
  if (tab === "CANCELLED")
    return status === "CANCELLED" || status === "REJECTED";
  return status === tab;
};

const CANCEL_ERRORS: Record<string, string> = {
  CANCELLATION_CLOSED:
    "It's too close to the start time to cancel online. Please call the restaurant.",
  BOOKING_ALREADY_CANCELLED: "This reservation is already cancelled.",
  BOOKING_REJECTED: "The restaurant has already rejected this request.",
};

const Reservations = () => {
  const { data: user, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>("ALL");
  const [toCancel, setToCancel] = useState<Booking | null>(null);
  // «Зараз» фіксуємо при відкритті сторінки: від нього рахуються статуси
  const [now] = useState(() => Date.now());

  const bookings = useQuery({
    queryKey: ["bookings"],
    queryFn: getBookings,
    enabled: Boolean(user),
  });

  const cancel = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      showToast("", "success", "Reservation Cancelled!");
    },
    onError: (error) => {
      const code = getApiError(error)?.code ?? "";
      showToast(
        CANCEL_ERRORS[code] ??
          "Could not cancel the reservation. Please try again.",
        "error",
      );
    },
    onSettled: () => {
      setToCancel(null);
      // Оновлюємо список і режим передзамовлення (якщо він був для цього бронювання)
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  if (isLoading) {
    return <p className={`container ${css.status}`}>Loading...</p>;
  }

  // Гість: сторінка лише для користувачів, що увійшли
  if (!user) {
    return (
      <section className={css.page}>
        <div className={`container ${css.empty}`}>
          <h1 className={css.emptyTitle}>Sign in to see your reservations</h1>
          <ButtonLink href="/reservations?auth=sign-in">Sign In</ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <div className={css.page}>
      <section className={css.greeting}>
        <div className={`container ${css.greetingInner}`}>
          <h1 className={css.hello}>
            Hello, {user.first_name} {user.last_name}
          </h1>

          <p className={css.support}>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={css.supportIcon}
            >
              <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
              <rect x="3" y="13" width="4" height="6" rx="1.5" />
              <rect x="17" y="13" width="4" height="6" rx="1.5" />
              <path d="M19 19c0 1.5-1.5 2.5-4 2.5h-2" />
            </svg>
            <span>
              For any assistance with your table reservation or pre-order,
              please call us at this number:{" "}
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}>
                {SUPPORT_PHONE}
              </a>
              .
            </span>
          </p>
        </div>
      </section>

      {bookings.isLoading && (
        <p className={`container ${css.status}`}>Loading reservations...</p>
      )}

      {bookings.isError && (
        <p className={`container ${css.status}`}>
          Could not load your reservations. Please try again later.
        </p>
      )}

      {bookings.data && bookings.data.length === 0 && (
        <section className={`container ${css.empty}`}>
          <Image
            src="/image/reservations-empty.svg"
            alt=""
            width={439}
            height={423}
            className={css.illustration}
            priority
          />
          <h2 className={css.emptyTitle}>No Reservations</h2>
          <p className={css.emptyText}>
            Looks like you haven&apos;t made any reservations yet.
          </p>
          <Link href="/booking" className={css.bookLink}>
            Book a Table
          </Link>
        </section>
      )}

      {bookings.data && bookings.data.length > 0 && (
        <section
          className={`container ${css.list}`}
          aria-label="Your reservations"
        >
          <div
            className={css.tabs}
            role="group"
            aria-label="Filter reservations"
          >
            {TABS.map(({ value, label }) => {
              const count = bookings.data.filter((booking) =>
                matchesTab(value, getReservationStatus(booking, now)),
              ).length;
              return (
                <button
                  key={value}
                  type="button"
                  className={css.tab}
                  aria-pressed={tab === value}
                  onClick={() => setTab(value)}
                >
                  {label}
                  <span className={css.tabCount}>{count}</span>
                </button>
              );
            })}
          </div>

          <ul className={css.cards}>
            {bookings.data
              .map((booking) => ({
                booking,
                status: getReservationStatus(booking, now),
              }))
              .filter(({ status }) => matchesTab(tab, status))
              .map(({ booking, status }) => (
                <li key={booking.id}>
                  <ReservationCard
                    booking={booking}
                    status={status}
                    onCancel={setToCancel}
                  />
                </li>
              ))}
          </ul>
        </section>
      )}

      {toCancel && (
        <CancelBookingModal
          booking={toCancel}
          isCancelling={cancel.isPending}
          onConfirm={() => cancel.mutate(toCancel.id)}
          onClose={() => !cancel.isPending && setToCancel(null)}
        />
      )}
    </div>
  );
};

export default Reservations;
