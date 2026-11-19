import { describe, it, expect } from "vitest";
import { formatPrice } from "./formatPrice";

// Бекенд віддає ціну в центах — перевіряємо, як вона виглядає для гостя
describe("formatPrice", () => {
  it("показує цілу ціну без копійок", () => {
    expect(formatPrice(1700)).toBe("$17");
  });

  it("показує дробову ціну з двома знаками", () => {
    expect(formatPrice(1750)).toBe("$17.50");
  });

  it("не губить копійки, коли їх менше 10", () => {
    expect(formatPrice(1705)).toBe("$17.05");
  });

  it("працює з нулем", () => {
    expect(formatPrice(0)).toBe("$0");
  });

  it("працює з ціною менше долара", () => {
    expect(formatPrice(99)).toBe("$0.99");
  });
});
