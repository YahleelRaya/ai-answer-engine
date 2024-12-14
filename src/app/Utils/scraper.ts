import puppeteer from "puppeteer";
import { Redis } from "@upstash/redis";

export const urlPattern = /https?:\/\/(www\.)?[a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

function cleanText(text: string): string {
  return text.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
}

export async function scrapeUrl(url: string) {
  try {
    // Check if a summary is already cached
    const cachedSummary = await redis.get(`summary:${url}`);
    if (cachedSummary) {
      console.log(`Returning cached summary for URL: ${url}`);
      return { cached: true, content: cachedSummary };
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the URL
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Remove unwanted elements
    await page.evaluate(() => {
      const elementsToRemove = ["script", "style", "noscript", "iframe"];
      elementsToRemove.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => el.remove());
      });
    });

    // Extract the page content
    const scrapedData = await page.evaluate(() => {
      const getText = (selector: string): string =>
        Array.from(document.querySelectorAll(selector))
          .map((el) => (el as HTMLElement).textContent?.trim() || "")
          .join(" ");

      return {
        title: document.querySelector("title")?.textContent || "",
        metaDescription:
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute("content") || "",
        h1: getText("h1"),
        h2: getText("h2"),
        articleText: getText("article"),
        mainText: getText("main"),
        contentText: getText(".content, #content, [class*='content']"),
        paragraphs: getText("p"),
        listItems: getText("li"),
      };
    });

    // Combine and clean the content
    let combinedContent = [
      scrapedData.title,
      scrapedData.metaDescription,
      scrapedData.h1,
      scrapedData.h2,
      scrapedData.articleText,
      scrapedData.mainText,
      scrapedData.contentText,
      scrapedData.paragraphs,
      scrapedData.listItems,
    ].join(" ");
    combinedContent = cleanText(combinedContent).slice(0, 10000);

    await browser.close();

    // Return the scraped content (combinedContent)
    return {
      cached: false,
      url,
      title: cleanText(scrapedData.title),
      headings: {
        h1: cleanText(scrapedData.h1),
        h2: cleanText(scrapedData.h2),
      },
      metaDescription: cleanText(scrapedData.metaDescription),
      content: combinedContent,
      error: null,
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return {
      cached: false,
      url,
      title: "",
      headings: { h1: "", h2: "" },
      metaDescription: "",
      content: "",
      error: "Failed to scrape URL",
    };
  }
}


