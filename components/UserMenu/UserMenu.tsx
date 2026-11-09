"use client";

import css from "./UserMenu.module.css";
import { useEffect, useRef, useState } from "react";
import type { User } from "@/types/user";

type Props = {
  user: User;
  onLogout: () => void;
};

export const UserIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={css.userIcon}>
    <circle cx="12" cy="12" r="9.25" />
    <circle cx="12" cy="10" r="3.25" />
    <path d="M6.2 18.4c1.3-2.1 3.4-3.2 5.8-3.2s4.5 1.1 5.8 3.2" />
  </svg>
);

// Іконка профілю в хедері (як у Figma) з випадним меню
const UserMenu = ({ user, onLogout }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закриваємо по кліку поза меню і по Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={css.wrapper} ref={menuRef}>
      <button
        type="button"
        className={css.trigger}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <UserIcon />
      </button>

      {isOpen && (
        <div className={css.dropdown} role="menu">
          <p className={css.name}>
            {user.first_name} {user.last_name}
          </p>
          <p className={css.email}>{user.email}</p>
          <button
            type="button"
            role="menuitem"
            className={css.logout}
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
