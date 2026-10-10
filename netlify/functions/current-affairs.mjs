
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
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(xml, tag) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(
    new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}\\s*>`, "i")
  );
  return match ? clean(match[1]) : "";
}

function parseFeed(xml, feed) {
  const items = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];
  const entries = xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) || [];
  const records = items.length ? items : entries;

  return records.slice(0, 20).map(item => {
    const atomLink = item.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
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
  }).filter(article => article.title && /^https?:\/\//i.test(article.link));
}

export default async function handler(request) {
  const results = await Promise.all(
    FEEDS.map(async feed => {
      try {
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "CivilsOS/1.0" },
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
          error: String(error.message || error)
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

  return new Response(JSON.stringify({
    generatedAt: new Date().toISOString(),
    articles,
    sources: results.map(result => ({
      source: result.source,
      count: result.articles.length,
      error: result.error
    }))
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=900"
    }
  });
}
