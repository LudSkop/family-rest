"use client";

import css from "./Locations.module.css";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLocations } from "@/lib/api/clientApi";
import LocationCard from "@/components/LocationCard/LocationCard";
import SectionTitle from "@/components/SectionTitle/SectionTitle";
import LocationModal from "@/components/LocationModal/LocationModal";

const Locations = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
                <LocationCard location={location} onOpen={setSelectedId} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedId && (
        <LocationModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </section>
  );
};

export default Locations;
