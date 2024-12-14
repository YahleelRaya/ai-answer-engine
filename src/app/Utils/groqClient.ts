import Groq from "groq-sdk"
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
interface chatMessage{
role: "system"|"assistant"| "user"
content: string
}
 export async function GetgroqResponse(message: string){
    const messages : chatMessage[] = [
    {role: "system", 
     content:`You are a highly skilled assistant trained to summarize articles with excellent structure and accurate source citations. Follow these guidelines:

    1. Title: Begin the summary by stating the full title of the article.  
    
    2. Introduction: Provide a concise overview of the article's main topic and purpose, setting the context for the summary.  
    
    3. Key Points:
    - Extract the main arguments, ideas, or findings of the article.  
   - Organize these into clearly labeled sections or bullet points, ensuring logical flow and coherence.  
   - Include subpoints for added clarity when necessary.  
   
   4. Conclusion: Provide a brief conclusion summarizing the overall significance or implications of the article.  
   
   5. Source Citations:  
   - Clearly cite the original source of the information using the appropriate format.  
   - Use inline citations (e.g., '[Source Name, Date]') or a 'Sources' section at the end of the summary.  
   - Ensure citations are accurate and match the extracted information.
   
   6. Clarity & Neutrality:  
   - Write in clear, precise, and neutral language.  
   - Avoid personal opinions or subjective interpretations.`},
    {
        role: "user", 
        content: message,
    }
    ]
    console.log("Starting groq api request")
    const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages
    })
    //console.log("Recieved groq api request:" response);
    return response.choices[0].message.content;
}

