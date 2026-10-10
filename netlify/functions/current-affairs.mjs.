
const FEEDS = [
  {
    name: "Insights IAS",
    url: "https://www.insightsonindia.com/feed",
    priority: "primary"
  },
  {
    name: "Down To Earth",
    url: "https://www.downtoearth.org.in/feed",
    priority: "supplement"
  },
  {
    name: "World Economic Forum",
    url: "https://www.weforum.org/feed/",
    priority: "supplement"
  }
];

function clean(value = "") {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCodePoint(Number(n))
    )
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(xml, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`,
    "i"
  );
  const match = xml.match(pattern);
  return match ? clean(match[1]) : "";
}

function parseFeed(xml, feed) {
  const items = [
    ...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)
  ];

  return items.slice(0, 20).map(match => {
    const item = match[2];
    const atomLink = item.match(
      /<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i
    );

    const link = getTag(item, "link") || (atomLink ? atomLink[1] : "");

    return {
      title: getTag(item, "title") || "Untitled article",
      link: link.trim(),
      published:
        getTag(item, "pubDate") ||
        getTag(item, "published") ||
        getTag(item, "updated"),
      summary:
        getTag(item, "description") ||
        getTag(item, "summary") ||
        getTag(item, "content"),
      source: feed.name,
      priority: feed.priority
    };
  }).filter(article =>
    article.title && /^https?:\/\//i.test(article.link)
  );
}

 export async function handler() {
  const results = await Promise.all(
    FEEDS.map(async feed => {
      try {
        const response = await fetch(feed.url, {
          headers: {
            "User-Agent": "CivilsOS/1.0"
          },
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const xml = await response.text();
        const articles = parseFeed(xml, feed);

        return {
          source: feed.name,
          articles,
          error: null
        };
      } catch (error) {
        return {
          source: feed.name,
          articles: [],
          error: "Feed unavailable or could not be parsed."
        };
      }
    })
  );

  const articles = results
    .flatMap(result => result.articles)
    .sort((a, b) =>
      (Date.parse(b.published || "") || 0) -
      (Date.parse(a.published || "") || 0)
    );

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=900"
    },
    body: JSON.stringify({
      generatedAt: new Date().toISOString(),
      articles,
      sources: results.map(result => ({
        source: result.source,
        count: result.articles.length,
        error: result.error
      }))
    })
  };
}

