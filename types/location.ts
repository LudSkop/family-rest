// Поля один в один як у відповіді бекенда (GET /locations)
export interface Location {
  id: string;
  address: string;
  image_url: string;
  table_count: number;
}

// GET /locations/{id} — та сама картка + опис
export interface LocationDetails extends Location {
  description: string;
}
