"use client";

import css from "./Reservations.module.css";
import Image from "next/image";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ButtonLink from "@/components/ButtonLink/ButtonLink";

const SUPPORT_PHONE = "+123 445 678 8990";

const Reservations = () => {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <p className={`container ${css.status}`}>Loading...</p>;
  }

  // Гість: сторінка лише для користувачів, що увійшли
  if (!user) {
    return (
      <section className={css.page}>
        <div className={`container ${css.empty}`}>
          <h1 className={css.emptyTitle}>Sign in to see your reservations</h1>
          <ButtonLink href="/reservations?auth=sign-in">Sign In</ButtonLink>
        </div>
      </section>
    );
  }

  return (
    <div className={css.page}>
      <section className={css.greeting}>
        <div className={`container ${css.greetingInner}`}>
          <h1 className={css.hello}>
            Hello, {user.first_name} {user.last_name}
          </h1>

          <p className={css.support}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className={css.supportIcon}>
              <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
              <rect x="3" y="13" width="4" height="6" rx="1.5" />
              <rect x="17" y="13" width="4" height="6" rx="1.5" />
              <path d="M19 19c0 1.5-1.5 2.5-4 2.5h-2" />
            </svg>
            <span>
              For any assistance with your table reservation or pre-order,
              please call us at this number:{" "}
              <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}>
                {SUPPORT_PHONE}
              </a>
              .
            </span>
          </p>
        </div>
      </section>

      {/* TODO: на бекенді ще немає ендпоінта бронювань — поки завжди порожній стан */}
      <section className={`container ${css.empty}`}>
        <Image
          src="/image/reservations-empty.svg"
          alt=""
          width={439}
          height={423}
          className={css.illustration}
          priority
        />
        <h2 className={css.emptyTitle}>No Reservations</h2>
        <p className={css.emptyText}>
          Looks like you haven&apos;t made any reservations yet.
        </p>
        <Link href="/booking" className={css.bookLink}>
          Book a Table
        </Link>
      </section>
    </div>
  );
};

export default Reservations;
