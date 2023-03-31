import type { NextApiRequest, NextApiResponse } from "next";
import RSS from "rss";
import { IncomingMessage } from "http";

export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? ""
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    feed_url: req.url,
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

  const host = getBaseUrl();

  episodes.forEach(function (episode) {
    feed.item({
      title: episode["episodeTitle"],
      description: episode["description"],
      url: `${host}/api/manifest.m4a?audioId=${episode["audioId"]}`, // link to the item
      guid: episode["audioId"], // optional - defaults to url
      date: episode["approvalTimestamp"], // any format that js Date can parse.
      enclosure: {
        url: `${host}/api/manifest.m4a?audioId=${episode["audioId"]}`,
      }, // optional enclosure
      custom_elements: [
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
