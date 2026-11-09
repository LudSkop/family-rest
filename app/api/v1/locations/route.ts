import { NextResponse } from "next/server";
import type { Location } from "@/types/location";

// TODO: на бекенді ще немає ендпоінта локацій — поки віддаємо моки.
// Коли з'явиться: const { data } = await api.get<Location[]>("/locations");
const MOCK_LOCATIONS: Location[] = [
  {
    id: "1",
    address: "48 Rustaveli Avenue",
    tables: 10,
    occupancy: 90,
    imageUrl: "/image/hero-bowl-citrus.png",
  },
  {
    id: "2",
    address: "14 Baratashvili Street",
    tables: 16,
    occupancy: 75,
    imageUrl: "/image/hero-bowl-avocado.png",
  },
  {
    id: "3",
    address: "9 Abashidze Street",
    tables: 20,
    occupancy: 80,
    imageUrl: "/image/hero-bowl-citrus.png",
  },
];

export async function GET() {
  return NextResponse.json(MOCK_LOCATIONS);
}
