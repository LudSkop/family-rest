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

export type BookingStatus = "CONFIRMED" | "CANCELLED";
export type ParticipantRole = "OWNER" | "GUEST";

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
}

// POST /bookings, GET /bookings
export interface Booking {
  id: string;
  status: BookingStatus;
  party_size: number;
  starts_at: string;
  ends_at: string;
  table: { id: string; label: string; capacity: number };
  location: BookingLocation;
  role: ParticipantRole;
  participants: Participant[];
}

// GET /invites/{code} — хто запрошує і на яке бронювання (вхід не потрібен)
export interface InvitePreview {
  owner_first_name: string;
  starts_at: string;
  ends_at: string;
  party_size: number;
  table: { id: string; label: string; capacity: number };
  location: BookingLocation;
}

// Режим передзамовлення: для якого бронювання зараз замовляємо страви.
// Зберігається в браузері (лише дані бронювання, жодних токенів)
export interface PreOrderSession {
  bookingId: string;
  role: ParticipantRole;
  // Ім'я власника — для «added to Jonson's table»
  ownerName: string;
  starts_at: string;
  ends_at: string;
  party_size: number;
  table: { id: string; label: string; capacity: number };
  location: BookingLocation;
}
