import { Mistral } from "@mistralai/mistralai";
import * as dotenv from 'dotenv';

dotenv.config();
  
const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

export const getMistralResponse = (text) => {
    const promptedText = `${text}\n\n La réponse que tu vas me générer est destinée à être lue vocalement, réponds moi de manière concise et sans inclure de caractères spéciaux.`;
  
    return mistral.chat
    .complete({
      model: "mistral-small-latest",
      messages: [
        {
          content: promptedText,
          role: "user",
        },
      ],
    })
    .then((response) => {
        const rawContent = response.choices[0]?.message?.content ?? "";
        const content = Array.isArray(rawContent)
          ? rawContent.map((chunk) => (typeof chunk === "string" ? chunk : (chunk.content ?? ""))).join("")
          : rawContent;
        return content;
    });
}
