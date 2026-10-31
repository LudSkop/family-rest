"use client";

import css from "./Header.module.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Main page" },
  { href: "/booking", label: "Book a Table" },
];

const Header = () => {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className={css.headerWrapper}>
      <div className={`container ${css.header}`}>
        <Link href="/" aria-label="Green Tasty — home" className={css.logo}>
          <Image
            src="/image/Logo.svg"
            alt="Green Tasty"
            width={100}
            height={36}
            priority
          />
        </Link>

        <nav aria-label="Main navigation" className={css.nav}>
          <ul className={css.navigation}>
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={css.navigationLink}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={css.actions}>
          <Link href="/sign-in" className={css.actionBtn}>
            Sign In
          </Link>

          <Link href="/sign-in/google" className={css.actionBtn}>
            <Image src="/image/google.svg" alt="" width={18} height={18} />
            Continue with Google
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
