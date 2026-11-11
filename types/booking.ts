// Поля один в один як у відповіді бекенда (GET /bookings/tables)

export interface TableSlot {
  // Час ресторану з поясом, напр. "2026-11-12T10:00:00+04:00"
  starts_at: string;
  available: boolean;
}

export interface BookingLocation {
  id: string;
  address: string;
  image_url: string;
}

export interface BookingTable {
  id: string;
  label: string;
  capacity: number;
  location: BookingLocation;
  slots: TableSlot[];
}

export interface TablePage {
  items: BookingTable[];
  total: number;
  limit: number;
  offset: number;
}
