"use client";

import css from "@/components/BookingConfirmedModal/BookingConfirmedModal.module.css";
import own from "./InviteLinkModal.module.css";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import { useToast } from "@/components/Toast/ToastProvider";
import { getInviteCode } from "@/lib/api/clientApi";
import {
  formatBookingDate,
  formatPeople,
  formatTimeRange,
} from "@/lib/utils/bookingTime";
import type { Booking } from "@/types/booking";

type Props = {
  booking: Booking;
  onClose: () => void;
};

// «Guest Invite link» з Figma: «Invite Guests» на картці бронювання
const InviteLinkModal = ({ booking, onClose }: Props) => {
  const { showToast } = useToast();

  const { data: code, isError } = useQuery({
    queryKey: ["bookings", booking.id, "invite"],
    queryFn: () => getInviteCode(booking.id),
    retry: false,
  });

  const inviteLink = code ? `${window.location.origin}/join/${code}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      showToast("Share it with your friends.", "success", "Link copied!");
    } catch {
      showToast("Could not copy the link. Copy it manually.", "error");
    }
  };

  const rows = [
    { label: "Location:", value: booking.location.address },
    { label: "Date:", value: formatBookingDate(booking.starts_at) },
    {
      label: "Time:",
      value: formatTimeRange(booking.starts_at, booking.ends_at),
    },
    { label: "Guests:", value: formatPeople(booking.party_size) },
  ];

  return (
    <Modal
      onClose={onClose}
      labelledBy="invite-link-title"
      className={css.modal}
    >
      <h2 id="invite-link-title" className={own.title}>
        Guest Invite link
      </h2>
      <p className={own.lead}>
        Share this link with your guests so they can place their pre-orders
      </p>

      <dl className={css.details}>
        {rows.map(({ label, value }) => (
          <div key={label} className={css.row}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className={own.invite}>
        <p className={css.inviteLabel} id="invite-link-label">
          Invite Link
        </p>
        <div className={css.linkBox}>
          <input
            className={css.linkInput}
            value={isError ? "Could not create the link" : inviteLink || "..."}
            readOnly
            aria-labelledby="invite-link-label"
            onFocus={(event) => event.target.select()}
          />
          <button
            type="button"
            className={css.copyBtn}
            onClick={copyLink}
            disabled={!inviteLink}
            aria-label="Copy invite link"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V6a2 2 0 0 1 2-2h9" />
            </svg>
          </button>
        </div>
        <p className={css.hint}>
          Copy this link, then paste it into a message to your guests.
        </p>
      </div>
    </Modal>
  );
};

export default InviteLinkModal;
