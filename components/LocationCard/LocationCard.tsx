import css from "./LocationCard.module.css";
import Image from "next/image";
import type { Location } from "@/types/location";

type Props = {
  location: Location;
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

const TableIcon = () => (
  <svg
    className={css.tableIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M4 7h16M12 7v13M8 20h8" />
  </svg>
);

const LocationCard = ({ location }: Props) => {
  const { address, tables, occupancy, imageUrl } = location;

  return (
    <article className={css.card}>
      <div className={css.imageWrapper}>
        <Image
          src={imageUrl}
          alt={`Family Rest restaurant at ${address}`}
          fill
          sizes="(min-width: 1440px) 432px, (min-width: 768px) 50vw, 100vw"
          className={css.image}
        />
      </div>

      <div className={css.body}>
        <h3 className={css.address}>
          <PinIcon />
          {address}
        </h3>

        <div className={css.details}>
          <p className={css.tables}>
            <TableIcon />
            {tables} tables
          </p>
          <p className={css.occupancy}>
            Daily occupancy: <span>{occupancy}%</span>
          </p>
        </div>
      </div>
    </article>
  );
};

export default LocationCard;
