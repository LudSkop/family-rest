import css from "./ButtonLink.module.css";
import Link from "next/link";

type Props = {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  onClick?: () => void;
};

const ButtonLink = ({
  href,
  variant = "primary",
  children,
  onClick,
}: Props) => {
  return (
    <Link
      href={href}
      className={`${css.btn} ${css[variant]}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default ButtonLink;
