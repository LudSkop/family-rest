"use client";

import css from "./AssistantLauncher.module.css";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AssistantPanel, {
  AssistantIcon,
} from "@/components/AssistantPanel/AssistantPanel";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Props = {
  // Закрити мобільне меню хедера
  onOpen?: () => void;
};

// Значок асистента в хедері: видно всім, чат — лише тим, хто увійшов.
// Відкритий чат — це ?assistant=open в адресі (працює кнопка «назад»)
const AssistantLauncher = ({ onOpen }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user, isLoading } = useCurrentUser();

  const isOpen = searchParams.get("assistant") === "open";
  const isSigningIn = searchParams.has("auth");

  const withParams = (change: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    change(params);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const open = () => {
    onOpen?.();
    // Не увійшов — спершу Sign In, як у Book a Table; після входу чат відкриється сам
    router.push(
      withParams((params) => {
        params.set("assistant", "open");
        if (!user) params.set("auth", "sign-in");
      }),
      { scroll: false },
    );
  };

  const close = () =>
    router.replace(
      withParams((params) => params.delete("assistant")),
      { scroll: false },
    );

  // Закрили Sign In, так і не увійшовши, — чат не відкриваємо пізніше несподівано
  useEffect(() => {
    if (isOpen && !isLoading && !user && !isSigningIn) {
      router.replace(
        withParams((params) => params.delete("assistant")),
        { scroll: false },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoading, user, isSigningIn]);

  return (
    <>
      <button
        type="button"
        className={css.button}
        aria-label="Chat with the assistant"
        aria-haspopup="dialog"
        aria-expanded={isOpen && Boolean(user)}
        onClick={open}
      >
        <AssistantIcon />
      </button>

      {isOpen && user && !isSigningIn && (
        <AssistantPanel user={user} onClose={close} />
      )}
    </>
  );
};

export default AssistantLauncher;
