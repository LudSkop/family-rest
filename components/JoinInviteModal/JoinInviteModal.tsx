"use client";

import css from "./JoinInviteModal.module.css";
import authCss from "@/components/AuthForm/AuthForm.module.css";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import TextField from "@/components/TextField/TextField";
import ButtonLink from "@/components/ButtonLink/ButtonLink";
import {
  toPreOrderSession,
  usePreOrder,
} from "@/components/PreOrder/PreOrderProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getApiError, getInvite, joinInvite } from "@/lib/api/clientApi";
import {
  formatBookingDate,
  formatPeople,
  formatTimeRange,
} from "@/lib/utils/bookingTime";

type Props = {
  code: string;
};

const MAX_NAME_LENGTH = 50;

// «You're Invited!»: гість відкрив посилання-запрошення /join/<code>
const JoinInviteModal = ({ code }: Props) => {
  const router = useRouter();
  const { startPreOrder } = usePreOrder();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const invite = useQuery({
    queryKey: ["invites", code],
    queryFn: () => getInvite(code),
    retry: false,
  });

  const join = useMutation({
    mutationFn: (guestName?: string) => joinInvite(code, guestName),
    onSuccess: (booking) => {
      // Гість у режимі передзамовлення для цього бронювання → меню
      startPreOrder(toPreOrderSession(booking));
      router.replace("/menu");
    },
    onError: (error) => {
      const apiError = getApiError(error);

      switch (apiError?.code) {
        case "GUEST_NAME_REQUIRED":
          setNameError("Please enter your name.");
          break;
        case "BOOKING_FULL":
          setFormError(
            "This table is already full, so you can't join this reservation.",
          );
          break;
        case "INVITE_CLOSED":
        case "INVITE_NOT_FOUND":
          // Запрошення закрилось, поки гість заповнював форму
          invite.refetch();
          break;
        case "VALIDATION_ERROR":
          setNameError(apiError.message);
          break;
        default:
          setFormError(
            apiError?.message ?? "Something went wrong. Please try again.",
          );
      }
    },
  });

  const closeToHome = () => router.replace("/");

  // Залогінений приєднується під іменем профілю — поле імені не потрібне
  const isGuest = !isUserLoading && !user;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!isGuest) {
      join.mutate(undefined);
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Please enter your name.");
      return;
    }

    join.mutate(trimmed);
  };

  // ===== Завантаження =====
  if (invite.isLoading) {
    return (
      <Modal
        onClose={closeToHome}
        labelledBy="invite-title"
        className={css.modal}
      >
        <h2 id="invite-title" className={css.title}>
          You&apos;re Invited!
        </h2>
        <p className={authCss.loading} role="status">
          Loading the invitation...
        </p>
      </Modal>
    );
  }

  // ===== Запрошення не знайдене або закрите =====
  if (invite.isError || !invite.data) {
    const isClosed = getApiError(invite.error)?.code === "INVITE_CLOSED";

    return (
      <Modal
        onClose={closeToHome}
        labelledBy="invite-title"
        className={css.modal}
      >
        <h2 id="invite-title" className={css.title}>
          {isClosed ? "Invitation is closed" : "Invitation not found"}
        </h2>
        <p className={css.lead}>
          {isClosed
            ? "This reservation was cancelled or is about to start, so pre-orders are no longer accepted."
            : "This invitation link is invalid. Please ask the person who invited you for a new link."}
        </p>
        <ButtonLink href="/menu" variant="secondary">
          Browse Menu
        </ButtonLink>
      </Modal>
    );
  }

  // ===== «You're Invited!» =====
  const { owner_first_name, starts_at, ends_at, party_size, location } =
    invite.data;

  const rows = [
    { label: "Restaurant", value: "Family Rest" },
    { label: "Location", value: location.address },
    { label: "Date", value: formatBookingDate(starts_at) },
    { label: "Time", value: formatTimeRange(starts_at, ends_at) },
    { label: "Guests", value: formatPeople(party_size) },
  ];

  return (
    <Modal
      onClose={closeToHome}
      labelledBy="invite-title"
      className={css.modal}
    >
      <h2 id="invite-title" className={css.title}>
        You&apos;re Invited!
      </h2>
      <p className={css.lead}>
        {owner_first_name} invited you to pre-order for an upcoming reservation.
      </p>

      <dl className={css.details}>
        {rows.map(({ label, value }) => (
          <div key={label} className={css.row}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {formError && (
        <p className={authCss.banner} role="alert">
          {formError}
        </p>
      )}

      <form className={css.form} onSubmit={handleSubmit} noValidate>
        {isGuest && (
          <TextField
            label="Enter Your Name"
            name="name"
            autoComplete="name"
            placeholder="e.g. Jonson D."
            maxLength={MAX_NAME_LENGTH}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
            }}
            error={nameError ?? undefined}
          />
        )}

        <button
          type="submit"
          className={`${authCss.submit} ${authCss.submitActive}`}
          disabled={join.isPending || isUserLoading}
        >
          {join.isPending ? "Joining..." : "Browse Menu"}
        </button>
      </form>
    </Modal>
  );
};

export default JoinInviteModal;
