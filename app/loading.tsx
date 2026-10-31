import css from "./loading.module.css";

export default function Loading() {
  return (
    <div className={css.wrapper}>
      <div className={css.spinner}></div>
      <p className={css.text}>Loading, please wait...</p>
    </div>
  );
}
