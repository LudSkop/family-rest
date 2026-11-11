"use client";

import css from "./Locations.module.css";
import { useQuery } from "@tanstack/react-query";
import { getLocations } from "@/lib/api/clientApi";
import LocationCard from "@/components/LocationCard/LocationCard";
import SectionTitle from "@/components/SectionTitle/SectionTitle";

const Locations = () => {
  const {
    data: locations,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
  });

  return (
    <section id="locations" className={css.section}>
      <div className="container">
        <SectionTitle>Locations</SectionTitle>

        {isLoading && <p className={css.status}>Loading locations...</p>}

        {isError && (
          <p className={css.status}>
            Could not load locations. Please try again later.
          </p>
        )}

        {locations && locations.length > 0 && (
          <ul className={css.list}>
            {locations.map((location) => (
              <li key={location.id}>
                <LocationCard location={location} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default Locations;
