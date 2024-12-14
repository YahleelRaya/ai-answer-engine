// TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer
import { NextResponse } from "next/server"
import { GetgroqResponse } from "@/app/Utils/groqClient";
import { scrapeUrl, urlPattern } from "@/app/Utils/scraper"
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
export async function POST(req: Request) {
    try {
      const { message } = await req.json(); // Parse the incoming JSON body to get the URL
      console.log("Received message:",message);
      const match = message.match(urlPattern);
      const url = match ? match[0] : null;
      let scrapedContent = null
      
      if (url){
     console.log("URL found:", url);
    }

    const scrapedResponse = await scrapeUrl(url);

    // If cached, return the cached summary
    if (scrapedResponse.cached) {
      return NextResponse.json({ message: scrapedResponse.content });
    }
      console.log(scrapedResponse)
      scrapedContent = scrapedResponse.content;
     
      
      const userQuery = message.replace(url? url[0] : '','').trim();
      const prompt = `
You are a highly skilled assistant trained to summarize website content with excellent structure, accuracy, and clarity. Please follow these instructions carefully:

1. **Task**: Summarize the following website content while maintaining its key details and logical flow.

2. **Content to Summarize**:
<content>
${scrapedContent}
</content>

3. **Summary Structure**:
- **Title**: Provide a clear and concise title summarizing the main topic or theme of the content.
- **Introduction**: Write a brief paragraph introducing the topic, purpose, and context of the website content.
- **Key Points**:
  - Highlight the main ideas, arguments, or findings presented in the content.
  - Use bullet points for clarity, ensuring logical flow and coherence.
  - Include subpoints if necessary to clarify complex ideas.
- **Conclusion**: Write a short conclusion summarizing the overall significance or insights from the content.

4. **Additional Requirements**:
- Avoid adding any information not present in the provided content.
- If the content is incomplete or insufficient to provide a summary, state: "The provided content is insufficient to generate a full summary."
- Use simple, clear, and neutral language. Avoid technical jargon unless explicitly used in the content.

Generate your structured summary below:
`

      const response  = await GetgroqResponse(message)
      await redis.set(`response:${url}`, response, { ex: 86400 }); // Cache for 24 hours
    console.log(`Cached summary for URL: ${url}`);
      return NextResponse.json({ message:response})
    } catch (error) {
      return NextResponse.json({ message: "Error"})
    }
  }
  

