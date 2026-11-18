// Сповіщення користувача (GET /notifications).
// Поки лише про запити великих компаній: ресторан підтвердив / відхилив
export type NotificationKind =
  "BOOKING_REQUEST_APPROVED" | "BOOKING_REQUEST_REJECTED";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  booking_id: string;
  created_at: string;
  // null — ще не прочитане
  read_at: string | null;
}

export interface NotificationPage {
  items: AppNotification[];
  total: number;
  limit: number;
  offset: number;
}
