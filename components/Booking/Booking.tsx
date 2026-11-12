"use client";

import css from "./Booking.module.css";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import BookingForm, {
  ALL_TIMES,
  type BookingFormValues,
  type Errors,
} from "@/components/BookingForm/BookingForm";
import TableCard from "@/components/TableCard/TableCard";
import BookingConfirmedModal from "@/components/BookingConfirmedModal/BookingConfirmedModal";
import ConfirmBookingModal from "@/components/ConfirmBookingModal/ConfirmBookingModal";
import { useToast } from "@/components/Toast/ToastProvider";
import type { BookingTable, TableSlot } from "@/types/booking";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  createBooking,
  getApiError,
  getApiStatus,
  getLocations,
  searchTables,
  type SearchTablesParams,
} from "@/lib/api/clientApi";

const SUPPORT_PHONE = "+380963610573";

// "2026-10-17" → "Oct 17, 2026" (у UTC, щоб дата не зсунулась через пояс)
const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

const Booking = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: user } = useCurrentUser();

  const [search, setSearch] = useState<SearchTablesParams | null>(null);
  const [serverErrors, setServerErrors] = useState<Errors>({});

  // /booking?location=<id> — кнопка «Book a table» з модалки локації.
  // formKey змінюємо, коли треба підставити у форму нові значення
  const [formValues, setFormValues] = useState<Partial<BookingFormValues>>({
    locationId: searchParams.get("location") ?? "",
  });
  const [formKey, setFormKey] = useState(0);

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });

  const {
    mutate,
    data: result,
    isPending,
    isError,
  } = useMutation({
    mutationFn: searchTables,
    onError: (error) => {
      const apiError = getApiError(error);

      // Розгалужуємось за code: показуємо помилку під потрібним полем
      if (apiError?.code === "DATE_OUT_OF_RANGE")
        setServerErrors({ date: apiError.message });
      else if (apiError?.code === "SLOT_INVALID")
        setServerErrors({ time: apiError.message });
      else if (apiError?.code === "PARTY_TOO_LARGE")
        setServerErrors({ guests: apiError.message });
    },
  });

  const openSignIn = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("auth", "sign-in");
    router.push(`${pathname}?${params}`, { scroll: false });
  };

  // ===== Бронювання: клік по вільному часу =====
  // Обраний стіл і час — чекають підтвердження у вікні «Book this table?»
  const [selected, setSelected] = useState<{
    table: BookingTable;
    slot: TableSlot;
  } | null>(null);

  const booking = useMutation({
    mutationFn: createBooking,
    onSettled: () => setSelected(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      // Оновлюємо столи: щойно заброньований час стає зайнятим
      if (search) mutate(search);
    },
    onError: (error) => {
      const apiError = getApiError(error);

      // Сесія закінчилась — просимо увійти знову
      if (getApiStatus(error) === 401) {
        queryClient.setQueryData(["me"], null);
        openSignIn();
        return;
      }

      // Час уже зайняли — оновлюємо столи
      if (apiError?.code === "SLOT_UNAVAILABLE" && search) mutate(search);

      showToast(
        apiError?.message ?? "Could not book the table. Please try again.",
        "error",
      );
    },
  });

  const handleSelectSlot = (table: BookingTable, slot: TableSlot) => {
    if (!search) return;

    // «If user is not Signed In — Sign In Flow»
    if (!user) {
      openSignIn();
      return;
    }

    setSelected({ table, slot });
  };

  const confirmBooking = () => {
    if (!selected || !search) return;

    booking.mutate({
      table_id: selected.table.id,
      starts_at: selected.slot.starts_at,
      party_size: search.party_size,
    });
  };

  const handleSearch = (params: SearchTablesParams) => {
    setServerErrors({});
    setSearch(params);
    mutate(params);
  };

  // «Show all slots on <date>»: та сама дата й гості, усі локації, будь-який час
  const showAllSlots = () => {
    if (!search) return;

    setFormValues({
      locationId: "",
      date: search.date,
      time: ALL_TIMES,
      guests: search.party_size,
    });
    setFormKey((prev) => prev + 1);
    handleSearch({ date: search.date, party_size: search.party_size });
  };

  // «48 Rustaveli Avenue · Oct 17, 2026 · 11:00 · 2 guests»
  const summary = search
    ? [
        locations.find((location) => location.id === search.location_id)
          ?.address ?? "All Locations",
        formatDate(search.date),
        search.time ?? "All day",
        `${search.party_size} ${search.party_size === 1 ? "guest" : "guests"}`,
      ].join(" · ")
    : "";

  const showResults =
    isPending || result || (isError && !Object.keys(serverErrors).length);

  return (
    <div className={css.page}>
      {/* Форма і фото всередині контейнера — краї збігаються з хедером */}
      <div className={`container ${css.layout}`}>
        <div className={css.formColumn}>
          <BookingForm
            locations={locations}
            key={formKey}
            initialValues={formValues}
            isSearching={isPending}
            serverErrors={serverErrors}
            onSearch={handleSearch}
          />

          <p className={css.support}>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={css.phoneIcon}
            >
              <path d="M5 4h3l1.5 4-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" />
            </svg>
            <span>
              For groups larger than 4, please call us directly at{" "}
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}>
                {SUPPORT_PHONE}
              </a>
            </span>
          </p>
        </div>

        <div className={css.side}>
          {showResults ? (
            <section className={css.results} aria-live="polite">
              {isPending && (
                <p className={css.status}>Searching for tables...</p>
              )}

              {isError && (
                <p className={css.status}>
                  Could not search for tables. Please try again later.
                </p>
              )}

              {result && !isPending && (
                <>
                  <div className={css.resultsHead}>
                    <h2 className={css.resultsTitle}>
                      {result.total > 0
                        ? `${result.total} ${result.total === 1 ? "table" : "tables"} available`
                        : "No tables Available"}
                    </h2>
                    <p className={css.summary}>{summary}</p>
                  </div>

                  {result.items.length > 0 ? (
                    <ul className={css.tables}>
                      {result.items.map((table) => (
                        <li key={table.id}>
                          <TableCard
                            table={table}
                            onSelect={handleSelectSlot}
                            isBooking={booking.isPending}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={css.empty}>
                      <Image
                        src="/image/no-tables.svg"
                        alt=""
                        width={477}
                        height={465}
                        className={css.emptyImage}
                      />
                      <h3 className={css.emptyTitle}>No Tables Available</h3>
                      <p className={css.emptyText}>
                        Try adjusting your date, time, or number of guests to
                        find available tables.
                      </p>
                      {search && (
                        <button
                          type="button"
                          className={css.showAll}
                          onClick={showAllSlots}
                        >
                          Show all slots on {formatDate(search.date)}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          ) : (
            // Фото «Reserved» з Figma
            <Image
              src="/image/booking.jpg"
              alt=""
              fill
              sizes="(min-width: 1440px) 800px, 100vw"
              className={css.photo}
              priority
            />
          )}
        </div>
      </div>

      {selected && search && (
        <ConfirmBookingModal
          table={selected.table}
          slot={selected.slot}
          partySize={search.party_size}
          isBooking={booking.isPending}
          onConfirm={confirmBooking}
          // Поки бронювання відправляється, вікно не закриваємо
          onClose={() => !booking.isPending && setSelected(null)}
        />
      )}

      {booking.data && (
        <BookingConfirmedModal booking={booking.data} onClose={booking.reset} />
      )}
    </div>
  );
};

export default Booking;
