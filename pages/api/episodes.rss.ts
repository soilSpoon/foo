import type { NextApiRequest, NextApiResponse } from "next";
import RSS from "rss";

function getBaseUrl() {
  // 로컬은 http, 프로덕션은 https 라는 가정
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "localhost:3000";

  return `${protocol}://${host}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const baseUrl = getBaseUrl();

  const channelId = req.query.channelId;

  const episodesUrl = new URL(
    `https://audioclip.naver.com/api/channels/${channelId}/episodes`
  );

  episodesUrl.searchParams.append("sortType", "DESC");
  episodesUrl.searchParams.append("sortKey", "approvalYmdt");
  episodesUrl.searchParams.append("limit", "1000");

  const episodesResponse = await fetch(episodesUrl);
  const episodesJson = await episodesResponse.json();
  const episodes = episodesJson["episodes"];

  const feed = new RSS({
    title: episodesJson["channelName"],
    feed_url: `${baseUrl}/${req.url}`,
    site_url: `https://audioclip.naver.com/channels/${channelId}`,
    image_url: episodesJson["channelImageUrl"],
    language: "ko",
    categories: [episodesJson["categoryName"]],
    custom_namespaces: {
      itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
      atom: "http://www.w3.org/2005/Atom",
    },
    custom_elements: [
      { "itunes:subtitle": "Subtitle" },
      { "itunes:author": "" },
      {
        "itunes:summary": "Summary",
      },
      {
        "itunes:owner": [{ "itunes:name": "" }, { "itunes:email": "" }],
      },
      {
        "itunes:image": {
          _attr: {
            href: episodesJson["channelImageUrl"],
          },
        },
      },
      {
        "itunes:category": [
          {
            _attr: {
              text: episodesJson["categoryName"],
            },
          },
        ],
      },
    ],
  });

  episodes.forEach(function (episode) {
    feed.item({
      title: episode["episodeTitle"],
      description: episode["description"],
      url: `${baseUrl}/api/manifest.m4a?audioId=${episode["audioId"]}`, // link to the item
      guid: episode["audioId"], // optional - defaults to url
      date: episode["approvalTimestamp"], // any format that js Date can parse.
      enclosure: {
        url: `${baseUrl}/api/manifest.m4a?audioId=${episode["audioId"]}`,
        type: "audio/x-m4a",
        size: episode["audioFiles"][0]["fileSize"],
      }, // optional enclosure
      custom_elements: [
        { "itunes:author": "" },
        { "itunes:subtitle": "" },
        {
          "itunes:image": {
            _attr: {
              href: episode["imageUrl"],
            },
          },
        },
        { "itunes:duration": episode["playTime"] },
      ],
    });
  });

  res.setHeader("content-type", "text/xml");
  res.write(feed.xml());
  res.end();
}
