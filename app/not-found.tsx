import type { Metadata } from "next";
import ButtonLink from "@/components/ButtonLink/ButtonLink";
import css from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found | Family Rest",
  description: "The page you are looking for is not on our menu.",
};

export default function NotFound() {
  return (
    <section className={css.wrapper}>
      <div className={`container ${css.content}`}>
        <p className={css.code} aria-hidden="true">
          <span>4</span>
          <svg
            className={css.plate}
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="60" cy="60" r="56" className={css.plateOuter} />
            <circle cx="60" cy="60" r="40" className={css.plateInner} />
            <g className={css.leaf}>
              <path d="M60 74V58" stroke="#0f7a37" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M60 62C51 62 47 55 47.5 47C55 47 60.5 53 60 62Z" fill="#0f7a37" />
              <path d="M60 58C60.5 49 66.5 43 74.5 43.5C74.5 52 68.5 58 60 58Z" fill="#3a9d5d" />
            </g>
          </svg>
          <span>4</span>
        </p>

        <h1 className={css.title}>Oops! This plate is empty</h1>
        <p className={css.text}>
          The page you are looking for is not on our menu. It may have been
          moved or never existed. Let&apos;s get you back to something tasty.
        </p>

        <div className={css.actions}>
          <ButtonLink href="/">Back to main page</ButtonLink>
          <ButtonLink href="/booking" variant="secondary">
            Book a Table
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
