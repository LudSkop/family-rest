"use client";

import css from "./StaffRequests.module.css";
import cancelCss from "@/components/CancelBookingModal/CancelBookingModal.module.css";
import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import ButtonLink from "@/components/ButtonLink/ButtonLink";
import Modal from "@/components/Modal/Modal";
import Pagination from "@/components/Pagination/Pagination";
import { useToast } from "@/components/Toast/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  approveBookingRequest,
  getApiError,
  getApiStatus,
  getBookingRequests,
  rejectBookingRequest,
} from "@/lib/api/clientApi";
import {
  formatBookingDate,
  formatPeople,
  formatTimeRange,
} from "@/lib/utils/bookingTime";
import type { BookingRequest } from "@/types/booking";

const PAGE_SIZE = 20;

const DECISION_ERRORS: Record<string, string> = {
  REQUEST_NOT_PENDING: "This request has already been decided.",
  REQUEST_EXPIRED:
    "It's too close to the start time to approve. The request can only be rejected.",
  SLOT_UNAVAILABLE:
    "This table is already booked at that time. The request stays pending.",
};

// «Запит створено 2 год тому» — щоб персонал бачив, хто чекає довше
const formatCreated = (createdAt: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(createdAt));

// Сторінка персоналу: запити компаній 5–8 гостей, Approve / Reject
const StaffRequests = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  const [page, setPage] = useState(1);
  const [toReject, setToReject] = useState<BookingRequest | null>(null);

  const requests = useQuery({
    queryKey: ["staff", "booking-requests", page],
    queryFn: () => getBookingRequests((page - 1) * PAGE_SIZE, PAGE_SIZE),
    enabled: Boolean(user),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const onDecided = (message: string) => {
    showToast(message);
    // Підтвердження автоматично відхиляє конкуруючі запити — оновлюємо список
    queryClient.invalidateQueries({ queryKey: ["staff", "booking-requests"] });
  };

  const onDecisionError = (error: unknown) => {
    const code = getApiError(error)?.code ?? "";
    showToast(
      DECISION_ERRORS[code] ?? "Something went wrong. Please try again.",
      "error",
    );
    queryClient.invalidateQueries({ queryKey: ["staff", "booking-requests"] });
  };

  const approve = useMutation({
    mutationFn: approveBookingRequest,
    onSuccess: (request) =>
      onDecided(
        `${request.owner_first_name}'s request was approved. The guest has been notified.`,
      ),
    onError: onDecisionError,
  });

  const reject = useMutation({
    mutationFn: rejectBookingRequest,
    onSuccess: (request) =>
      onDecided(
        `${request.owner_first_name}'s request was rejected. The guest has been notified.`,
      ),
    onError: onDecisionError,
    onSettled: () => setToReject(null),
  });

  const isBusy = approve.isPending || reject.isPending;

  // ===== Хто бачить сторінку =====
  if (isUserLoading) {
    return <p className={`container ${css.status}`}>Loading...</p>;
  }

  if (!user) {
    return (
      <section className={css.page}>
        <div className={`container ${css.message}`}>
          <h1 className={css.title}>Booking Requests</h1>
          <p>Sign in with a staff account to review booking requests.</p>
          <ButtonLink href="/staff/requests?auth=sign-in">Sign In</ButtonLink>
        </div>
      </section>
    );
  }

  if (getApiStatus(requests.error) === 403) {
    return (
      <section className={css.page}>
        <div className={`container ${css.message}`}>
          <h1 className={css.title}>Booking Requests</h1>
          <p>This page is available to restaurant staff only.</p>
          <ButtonLink href="/" variant="secondary">
            Back to main page
          </ButtonLink>
        </div>
      </section>
    );
  }

  const data = requests.data;
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <section className={css.page}>
      <div className="container">
        <div className={css.header}>
          <h1 className={css.title}>Booking Requests</h1>
          {data && (
            <span className={css.count}>
              {data.total} {data.total === 1 ? "request" : "requests"} pending
            </span>
          )}
        </div>
        <p className={css.lead}>
          Groups of 5–8 guests book by request. Approving a request confirms the
          table and rejects other requests for the same table and time.
        </p>

        {requests.isLoading && (
          <p className={css.status}>Loading requests...</p>
        )}

        {requests.isError && (
          <p className={css.status}>
            Could not load booking requests. Please try again later.
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className={css.empty}>No pending requests right now. 🎉</p>
        )}

        {data && data.items.length > 0 && (
          <ul className={css.list}>
            {data.items.map((request) => (
              <li key={request.id}>
                <article className={css.card}>
                  <div className={css.cardHead}>
                    <h2 className={css.owner}>{request.owner_first_name}</h2>
                    <span className={css.party}>
                      {formatPeople(request.party_size)}
                    </span>
                  </div>

                  <dl className={css.details}>
                    <div>
                      <dt>Date</dt>
                      <dd>{formatBookingDate(request.starts_at)}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>
                        {formatTimeRange(request.starts_at, request.ends_at)}
                      </dd>
                    </div>
                    <div>
                      <dt>Table</dt>
                      <dd>
                        {request.table.label} · up to {request.table.capacity}
                      </dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{request.location.address}</dd>
                    </div>
                  </dl>

                  {request.competing_requests > 0 && (
                    <p className={css.competing}>
                      {request.competing_requests} other{" "}
                      {request.competing_requests === 1
                        ? "request wants"
                        : "requests want"}{" "}
                      this table at this time
                    </p>
                  )}

                  <p className={css.created}>
                    Requested {formatCreated(request.created_at)}
                  </p>

                  <div className={css.actions}>
                    <button
                      type="button"
                      className={css.reject}
                      onClick={() => setToReject(request)}
                      disabled={isBusy}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className={css.approve}
                      onClick={() => approve.mutate(request.id)}
                      disabled={isBusy}
                    >
                      {approve.isPending && approve.variables === request.id
                        ? "Approving..."
                        : "Approve"}
                    </button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        <div className={css.pagination}>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>

      {toReject && (
        <Modal
          onClose={() => !reject.isPending && setToReject(null)}
          labelledBy="reject-title"
          className={cancelCss.modal}
        >
          <h2 id="reject-title" className={cancelCss.title}>
            Reject Request
          </h2>
          <p className={cancelCss.text}>
            Reject {toReject.owner_first_name}&apos;s request for{" "}
            {formatPeople(toReject.party_size)} on{" "}
            {formatBookingDate(toReject.starts_at)},{" "}
            {formatTimeRange(toReject.starts_at, toReject.ends_at)}? The guest
            will be notified. You won&apos;t be able to undo this action.
          </p>
          <div className={cancelCss.actions}>
            <button
              type="button"
              className={cancelCss.keep}
              onClick={() => setToReject(null)}
              disabled={reject.isPending}
            >
              Keep it
            </button>
            <button
              type="button"
              className={cancelCss.cancel}
              onClick={() => reject.mutate(toReject.id)}
              disabled={reject.isPending}
            >
              {reject.isPending ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default StaffRequests;
