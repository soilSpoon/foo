import type { NextRequest } from "next/server";

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const audioId = searchParams.get("audioId");

  const tokenUrl = new URL(
    `https://apis.naver.com/audioclip/audioclip/v1/audios/${audioId}/token`
  );

  tokenUrl.searchParams.append("serviceId", "audioclip");
  tokenUrl.searchParams.append("serviceType", "CHANNEL");
  tokenUrl.searchParams.append("platform", "IOS");
  tokenUrl.searchParams.append("audioRightType", "DOWNLOAD");

  const tokenResponse = await fetch(tokenUrl);
  const tokenJson = await tokenResponse.json();

  const audioToken = tokenJson["audioToken"];

  const data = JSON.parse(atob(audioToken));

  const redirectUrl = data["audioInfo"]["url"];

  return fetch(redirectUrl);
}

export const config = {
  runtime: "edge",
};
