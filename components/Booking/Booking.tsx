"use client";

import css from "./Booking.module.css";
import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import BookingForm, { type Errors } from "@/components/BookingForm/BookingForm";
import {
  getApiError,
  getLocations,
  searchTables,
  type SearchTablesParams,
} from "@/lib/api/clientApi";

const SUPPORT_PHONE = "+380963610573";

// "2026-11-12T10:00:00+04:00" → "10:00" (час ресторану, без перерахунку поясу)
const slotTime = (startsAt: string) => startsAt.slice(11, 16);

const Booking = () => {
  const searchParams = useSearchParams();
  // /booking?location=<id> — кнопка «Book a table» з модалки локації
  const initialLocationId = searchParams.get("location") ?? "";

  const [search, setSearch] = useState<SearchTablesParams | null>(null);
  const [serverErrors, setServerErrors] = useState<Errors>({});

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });

  const {
    mutate,
    data: result,
    isPending,
    isError,
    reset,
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

  const handleSearch = (params: SearchTablesParams) => {
    setServerErrors({});
    setSearch(params);
    mutate(params);
  };

  const showResults =
    isPending || result || (isError && !Object.keys(serverErrors).length);

  return (
    <div className={css.page}>
      {/* Форма і фото всередині контейнера — краї збігаються з хедером */}
      <div className={`container ${css.layout}`}>
        <div className={css.formColumn}>
          <BookingForm
            locations={locations}
            initialLocationId={initialLocationId}
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
              <div className={css.resultsHead}>
                <h2 className={css.resultsTitle}>Available tables</h2>
                <button
                  type="button"
                  className={css.clear}
                  onClick={() => {
                    reset();
                    setSearch(null);
                  }}
                >
                  Clear
                </button>
              </div>

              {isPending && (
                <p className={css.status}>Searching for tables...</p>
              )}

              {isError && (
                <p className={css.status}>
                  Could not search for tables. Please try again later.
                </p>
              )}

              {result && result.items.length === 0 && (
                <p className={css.status}>
                  No free tables for this time. Try another time or location.
                </p>
              )}

              {result && result.items.length > 0 && (
                <ul className={css.tables}>
                  {result.items.map((table) => (
                    <li key={table.id} className={css.table}>
                      <p className={css.tableName}>
                        {table.label}
                        <span> · up to {table.capacity} guests</span>
                      </p>
                      <p className={css.tableAddress}>
                        {table.location.address}
                      </p>

                      <ul className={css.slots} aria-label="Free start times">
                        {table.slots
                          .filter((slot) => slot.available)
                          .map((slot) => (
                            <li
                              key={slot.starts_at}
                              className={`${css.slot} ${slotTime(slot.starts_at) === search?.time ? css.slotChosen : ""}`}
                            >
                              {slotTime(slot.starts_at)}
                            </li>
                          ))}
                      </ul>
                    </li>
                  ))}
                </ul>
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
    </div>
  );
};

export default Booking;
