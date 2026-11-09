import css from "./SectionTitle.module.css";

type Props = {
  children: React.ReactNode;
};

const SectionTitle = ({ children }: Props) => {
  return <h2 className={css.title}>{children}</h2>;
};

export default SectionTitle;
