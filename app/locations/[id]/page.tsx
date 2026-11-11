import type { Metadata } from "next";
import LocationDetails from "@/components/LocationDetails/LocationDetails";
import PopularDishes from "@/components/PopularDishes/PopularDishes";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Location | Family Rest",
};

export default async function LocationPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <LocationDetails id={id} />
      <PopularDishes />
    </>
  );
}
