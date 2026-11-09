// Бекенд віддає ціну в центах: 1700 → "$17", 1750 → "$17.50"
export const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100;
  return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
};
