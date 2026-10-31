"use client";

import css from "./Header.module.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Main page" },
  { href: "/booking", label: "Book a Table" },
];

const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const closeMenu = () => setIsMenuOpen(false);

  // Закриваємо мобільне меню по Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const navLinks = NAV_LINKS.map(({ href, label }) => (
    <li key={href}>
      <Link
        href={href}
        className={css.navigationLink}
        aria-current={isActive(href) ? "page" : undefined}
        onClick={closeMenu}
      >
        {label}
      </Link>
    </li>
  ));

  const actions = (
    <>
      <Link href="/sign-in" className={css.actionBtn} onClick={closeMenu}>
        Sign In
      </Link>

      <Link
        href="/sign-in/google"
        className={`${css.actionBtn} ${css.googleBtn}`}
        onClick={closeMenu}
      >
        <Image src="/image/google.svg" alt="" width={18} height={18} />
        <span className={css.googleText}>Continue with Google</span>
      </Link>
    </>
  );

  return (
    <header className={css.headerWrapper}>
      <div className={`container ${css.header}`}>
        <Link
          href="/"
          aria-label="Family Rest — home"
          className={css.logo}
          onClick={closeMenu}
        >
          <Image
            src="/image/Logo.svg"
            alt="Family Rest"
            width={142}
            height={38}
            priority
          />
        </Link>

        <nav aria-label="Main navigation" className={css.nav}>
          <ul className={css.navigation}>{navLinks}</ul>
        </nav>

        <div className={css.actions}>{actions}</div>

        <button
          type="button"
          className={css.burger}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span className={css.burgerLine} />
          <span className={css.burgerLine} />
          <span className={css.burgerLine} />
        </button>
      </div>

      {isMenuOpen && (
        <div id="mobile-menu" className={css.mobileMenu}>
          <div className="container">
            <nav aria-label="Mobile navigation">
              <ul className={css.mobileNavigation}>{navLinks}</ul>
            </nav>
            <div className={css.mobileActions}>{actions}</div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
