"use client";

import css from "./Modal.module.css";
import { useEffect, useRef } from "react";

type Props = {
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
};

// Нативний <dialog>: сам тримає фокус усередині й закривається по Escape
const Modal = ({ onClose, children, labelledBy }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    document.body.style.overflow = "hidden";

    // Одразу ставимо курсор у перше поле, а не на кнопку закриття
    dialog.querySelector("input")?.focus();

    // Якщо зараз показано toast — піднімаємо його над щойно відкритою модалкою
    document
      .querySelectorAll<HTMLElement>("[data-toast-root]:popover-open")
      .forEach((toastRoot) => {
        toastRoot.hidePopover();
        toastRoot.showPopover();
      });

    return () => {
      dialog.close();
      document.body.style.overflow = "";
    };
  }, []);

  // Клік по затемненню (сам <dialog>, а не його вміст) закриває модалку
  const handleClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;

    // Toast над модалкою браузер робить неактивним (inert), і клік по ньому
    // «проходить» на <dialog>. Тоді не закриваємо модалку, а натискаємо × toast
    const isInside = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
    };

    const toast = [
      ...document.querySelectorAll("[data-toast-root] [role]"),
    ].find(isInside);

    if (toast) {
      const dismissButton = toast.querySelector("button");
      if (dismissButton && isInside(dismissButton)) dismissButton.click();
      return;
    }

    onClose();
  };

  const handleCancel = (event: React.SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={css.dialog}
      aria-labelledby={labelledBy}
      onClick={handleClick}
      onCancel={handleCancel}
    >
      <div className={css.content}>
        <button
          type="button"
          className={css.close}
          aria-label="Close"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {children}
      </div>
    </dialog>
  );
};

export default Modal;
