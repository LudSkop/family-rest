import css from "./Hero.module.css";
import Image from "next/image";
import ButtonLink from "@/components/ButtonLink/ButtonLink";

const Hero = () => {
  return (
    <section className={css.hero}>
      <div className={`container ${css.inner}`}>
        <div className={css.content}>
          <h1 className={css.title}>
            Green by nature,
            <br />
            Georgian by heart.
          </h1>
          <p className={css.subtitle}>
            Seasonal bowls • Vegan friendly • Tbilisi
          </p>

          <div className={css.actions}>
            <ButtonLink href="/booking">Book a table</ButtonLink>
            <ButtonLink href="/menu" variant="secondary">
              View menu
            </ButtonLink>
          </div>
        </div>

        <div className={css.imageWrapper}>
          <Image
            src="/image/hero-bowl-avocado.png"
            alt="Salad bowl with avocado, cherry tomatoes and greens"
            width={560}
            height={532}
            sizes="(min-width: 1440px) 560px, 68vw"
            className={css.saladBack}
            priority
          />
          <Image
            src="/image/hero-bowl-citrus.png"
            alt="Salad bowl with citrus, figs and walnuts"
            width={532}
            height={405}
            sizes="(min-width: 1440px) 532px, 65vw"
            className={css.saladFront}
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
