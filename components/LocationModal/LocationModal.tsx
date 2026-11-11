"use client";

import css from "./LocationModal.module.css";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/Modal/Modal";
import ButtonLink from "@/components/ButtonLink/ButtonLink";
import { getLocation } from "@/lib/api/clientApi";

type Props = {
  id: string;
  onClose: () => void;
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

// Модалка з фото й описом ресторану (відкривається з картки в секції Locations)
const LocationModal = ({ id, onClose }: Props) => {
  const {
    data: location,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["locations", id],
    queryFn: () => getLocation(id),
    retry: false,
  });

  // Опис може містити кілька абзаців, розділених переносом рядка
  const paragraphs =
    location?.description
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean) ?? [];

  return (
    <Modal
      onClose={onClose}
      labelledBy="location-title"
      className={css.modal}
    >
      {isLoading && <p className={css.status}>Loading location...</p>}

      {isError && (
        <p className={css.status}>
          Could not load the location. Please try again later.
        </p>
      )}

      {location && (
        <>
          <div className={css.imageWrapper}>
            <Image
              src={location.image_url}
              alt={`Family Rest restaurant at ${location.address}`}
              fill
              sizes="(min-width: 768px) 520px, 100vw"
              className={css.image}
            />
          </div>

          <h2 id="location-title" className={css.address}>
            <PinIcon />
            {location.address}
          </h2>
          {/* TODO: рейтинг «4.73 / 5 ★» з Figma — бекенд поки не віддає цих даних */}

          <h3 className={css.subtitle}>Atmosphere</h3>
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
        </>
      )}
    </Modal>
  );
};

export default LocationModal;
