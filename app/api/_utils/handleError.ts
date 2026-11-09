import { isAxiosError } from "axios";
import { NextResponse } from "next/server";

// Повертаємо помилку бекенда без змін (той самий статус і { code, message }),
// бо клієнт розгалужується саме за полем code
export const handleError = (error: unknown) => {
  if (isAxiosError(error) && error.response) {
    return NextResponse.json(error.response.data, {
      status: error.response.status,
    });
  }

  return NextResponse.json(
    { code: "SERVER_ERROR", message: "Something went wrong" },
    { status: 500 },
  );
};
