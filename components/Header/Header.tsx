"use client";

import css from "./Header.module.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GOOGLE_LOGIN_URL } from "@/components/GoogleButton/GoogleButton";
import UserMenu from "@/components/UserMenu/UserMenu";
import { useToast } from "@/components/Toast/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { logout } from "@/lib/api/clientApi";

const NAV_LINKS = [
  { href: "/", label: "Main page" },
  { href: "/booking", label: "Book a Table" },
];

// Додатковий пункт лише для користувача, що увійшов (як у Figma)
const USER_NAV_LINKS = [{ href: "/reservations", label: "Reservations" }];

// Сторінки, з яких після виходу повертаємо на головну
const PRIVATE_PATHS = ["/reservations"];

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: user } = useCurrentUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { mutate: logoutMutate } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["me"], null);
      showToast("You have signed out.");
      if (PRIVATE_PATHS.some((path) => pathname.startsWith(path))) {
        router.push("/");
      }
    },
    onError: () => showToast("Could not sign out. Please try again.", "error"),
  });

  const handleLogout = () => {
    setIsMenuOpen(false);
    logoutMutate();
  };

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

  const links = user ? [...NAV_LINKS, ...USER_NAV_LINKS] : NAV_LINKS;

  const navLinks = links.map(({ href, label }) => (
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

  const guestActions = (
    <>
      <Link
        href={`${pathname}?auth=sign-in`}
        scroll={false}
        className={css.actionBtn}
        onClick={closeMenu}
      >
        Sign In
      </Link>

      {/* Звичайний <a>, не <Link>: Google-вхід — повна навігація браузера */}
      <a
        href={GOOGLE_LOGIN_URL}
        className={`${css.actionBtn} ${css.googleBtn}`}
      >
        <Image src="/image/google.svg" alt="" width={18} height={18} />
        <span className={css.googleText}>Continue with Google</span>
      </a>
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

        <div className={css.actions}>
          {user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            guestActions
          )}
        </div>

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
            <div className={css.mobileActions}>
              {user ? (
                <>
                  <p className={css.mobileUser}>
                    {user.first_name} {user.last_name}
                  </p>
                  <button
                    type="button"
                    className={css.actionBtn}
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                guestActions
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
