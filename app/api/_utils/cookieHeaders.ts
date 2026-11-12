// Для запитів, які потребують входу: пересилаємо бекенду cookie браузера
// (access_token, refresh_token). Самі токени не читаємо і ніде не зберігаємо
export const cookieHeaders = (request: Request) => {
  const cookie = request.headers.get("cookie");
  return cookie ? { Cookie: cookie } : {};
};
