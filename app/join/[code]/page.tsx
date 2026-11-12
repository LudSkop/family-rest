import type { Metadata } from "next";
import { Suspense } from "react";
import Menu from "@/components/Menu/Menu";
import JoinInviteModal from "@/components/JoinInviteModal/JoinInviteModal";

type Props = {
  params: Promise<{ code: string }>;
};

export const metadata: Metadata = {
  title: "You're Invited | Family Rest",
  description: "Join the reservation and pre-order your dishes.",
};

// Посилання-запрошення: на фоні меню — модалка «You're Invited!» (як у Figma)
export default async function JoinPage({ params }: Props) {
  const { code } = await params;

  return (
    <>
      {/* Menu читає фільтри з адреси (useSearchParams) — потрібен Suspense */}
      <Suspense fallback={null}>
        <Menu />
      </Suspense>
      <JoinInviteModal code={code} />
    </>
  );
}
