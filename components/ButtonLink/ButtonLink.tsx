import css from "./ButtonLink.module.css";
import Link from "next/link";

type Props = {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
};

const ButtonLink = ({ href, variant = "primary", children }: Props) => {
  return (
    <Link href={href} className={`${css.btn} ${css[variant]}`}>
      {children}
    </Link>
  );
};

export default ButtonLink;
