"use client";

import css from "./LocationDetails.module.css";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import ButtonLink from "@/components/ButtonLink/ButtonLink";
import { getApiStatus, getLocation } from "@/lib/api/clientApi";

type Props = {
  id: string;
};

const PinIcon = () => (
  <svg
    className={css.pinIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 21s-7-6.1-7-11.5a7 7 0 1 1 14 0C19 14.9 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

const LocationDetails = ({ id }: Props) => {
  const {
    data: location,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["locations", id],
    queryFn: () => getLocation(id),
    retry: false,
  });

  if (isLoading) {
    return (
      <section className={css.hero}>
        <p className={`container ${css.status}`}>Loading location...</p>
      </section>
    );
  }

  if (!location) {
    // 404 — такої локації немає; 422 — id взагалі не схожий на справжній
    const status = getApiStatus(error);
    const isNotFound = status === 404 || status === 422;

    return (
      <section className={css.hero}>
        <div className={`container ${css.status}`}>
          <p>
            {isNotFound
              ? "We couldn't find this location."
              : "Could not load the location. Please try again later."}
          </p>
          <ButtonLink href="/#locations" variant="secondary">
            All locations
          </ButtonLink>
        </div>
      </section>
    );
  }

  // Опис може містити кілька абзаців, розділених переносом рядка
  const paragraphs = location.description
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section className={css.hero}>
      <div className={css.imageWrapper}>
        <Image
          src={location.image_url}
          alt={`Family Rest restaurant at ${location.address}`}
          fill
          sizes="100vw"
          className={css.image}
          priority
        />
      </div>

      <div className={`container ${css.inner}`}>
        <article className={css.card}>
          <h1 className={css.address}>
            <PinIcon />
            {location.address}
          </h1>
          {/* TODO: рейтинг «4.73 / 5 ★» з Figma — бекенд поки не віддає цих даних */}

          <h2 className={css.subtitle}>Atmosphere</h2>
          <div className={css.description}>
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className={css.actions}>
            <ButtonLink href={`/booking?location=${location.id}`}>
              Book a table
            </ButtonLink>
            <ButtonLink href="/menu" variant="secondary">
              View menu
            </ButtonLink>
          </div>
        </article>
      </div>
    </section>
  );
};

export default LocationDetails;
