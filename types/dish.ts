// Поля один в один як у відповіді бекенда (GET /menu/dishes)

export type DishCategory = "APPETIZER" | "MAIN_COURSE" | "DESSERT";

export type DishSort = "POPULAR" | "NEWEST" | "PRICE_ASC" | "PRICE_DESC";

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  price_cents: number;
  weight_grams: number;
  is_available: boolean;
  popularity: number;
  image_url: string;
}

export interface DishPage {
  items: Dish[];
  total: number;
  limit: number;
  offset: number;
}
