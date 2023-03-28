import type { NextRequest } from "next/server";

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const webUrl = searchParams.get("url");

  const apiUrl = webUrl
    .replace("channels", "api/channels")
    .replace("clips", "episodes");

  const response = await fetch(apiUrl);
  const foo = await response.json();

  const audioId = foo["audioId"];

  const tokenUrl = new URL(
    `https://apis.naver.com/audioclip/audioclip/v1/audios/${audioId}/token`
  );

  tokenUrl.searchParams.append("serviceId", "audioclip");
  tokenUrl.searchParams.append("serviceType", "CHANNEL");
  tokenUrl.searchParams.append("platform", "WEB");
  tokenUrl.searchParams.append("quality", "HIGH");

  const tokenResponse = await fetch(tokenUrl);
  const tokenJson = await tokenResponse.json();

  const audioToken = tokenJson["audioToken"];
  const data = JSON.parse(atob(audioToken));

  const redirectUrl = data["audioInfo"]["url"];

  return fetch(redirectUrl, {
    redirect: "manual",
  });
}

export const config = {
  runtime: "edge",
};
