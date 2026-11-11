import css from "./Pagination.module.css";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

// Номери сторінок: 1 … 4 5 6 … 10 (поточна і по одній сусідній з кожного боку)
const getPages = (page: number, totalPages: number) => {
  const pages: (number | "gap")[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const isEdge = i === 1 || i === totalPages;
    const isNear = Math.abs(i - page) <= 1;

    if (isEdge || isNear) pages.push(i);
    else if (pages.at(-1) !== "gap") pages.push("gap");
  }

  return pages;
};

const Pagination = ({ page, totalPages, onChange }: Props) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Menu pages" className={css.pagination}>
      <button
        type="button"
        className={css.arrow}
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      <ul className={css.list}>
        {getPages(page, totalPages).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} className={css.gap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={css.page}
                onClick={() => onChange(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className={css.arrow}
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
};

export default Pagination;
