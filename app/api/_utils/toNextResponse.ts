import type { AxiosResponse } from "axios";
import { NextResponse } from "next/server";

// Відповідь бекенда → відповідь браузеру: той самий статус, тіло
// і cookie сесії (access_token / refresh_token ставить бекенд)
export const toNextResponse = (response: AxiosResponse) => {
  const nextResponse =
    response.status === 204
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(response.data, { status: response.status });

  const setCookie = response.headers["set-cookie"];
  setCookie?.forEach((cookie) => {
    nextResponse.headers.append("Set-Cookie", cookie);
  });

  return nextResponse;
};
