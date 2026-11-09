"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SignInModal from "@/components/SignInModal/SignInModal";
import SignUpModal from "@/components/SignUpModal/SignUpModal";

// Модалки авторизації відкриваються через ?auth=... в адресі:
// так їх можна відкрити з будь-якої сторінки посиланням (напр. після verify-email)
const AuthModals = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const modal = searchParams.get("auth");

  const close = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  if (modal === "sign-in") return <SignInModal onClose={close} />;
  if (modal === "sign-up") return <SignUpModal onClose={close} />;

  return null;
};

export default AuthModals;
