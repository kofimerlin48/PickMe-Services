
import { GoogleGenAI, Chat } from "@google/genai";
import { MOCK_RESTAURANTS } from "../constants";

let aiClient: GoogleGenAI | null = null;

const getClient = () => {
    if (!aiClient) {
        aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    }
    return aiClient;
};

const getMenuContext = () => {
    return MOCK_RESTAURANTS.map(r => 
        `Restaurant: ${r.name} (ID: ${r.id}, Cuisine: ${r.cuisine}). \nMenu: ${r.menu.map(m => `- ${m.name} (ID: ${m.id}, Price: ${m.price} GHS, Desc: ${m.description})`).join('\n')}`
    ).join('\n\n');
};

const SYSTEM_INSTRUCTION = `You are "PickMe Chef", a warm, human-like food concierge for PickMe Services.

GUIDELINES:
- Be concise. Keep answers short (under 3 sentences) unless listing items.
- Be warm and friendly, not robotic.
- If users are stuck, ask if they need Support (0534742142).
- Guide users to "Add your Restaurant" if they ask about partnering.

KNOWLEDGE:
- Partners: Click "Add your Restaurant" at top or bottom.
- Payment: MTN MoMo, Telecel Cash, AT Money.
- Menu: See below.

MENU DATA:
${getMenuContext()}

JSON FORMAT (Only if recommending ONE specific item to open):
\`\`\`json
{
  "recommendedMealId": "MEAL_ID",
  "recommendedRestaurantId": "RESTAURANT_ID"
}
\`\`\`
`;

export const createChatSession = () => {
    const ai = getClient();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
        }
    });
};

export const sendMessageToAI = async (chat: Chat, message: string) => {
    try {
        const response = await chat.sendMessage({ message });
        const text = response.text || "Connection glitch. Try again?";
        
        let recommendedMealId: string | undefined;
        let recommendedRestaurantId: string | undefined;
        let cleanText = text;

        const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                const data = JSON.parse(jsonMatch[1]);
                recommendedMealId = data.recommendedMealId;
                recommendedRestaurantId = data.recommendedRestaurantId;
                cleanText = text.replace(/```json[\s\S]*?```/, '').trim();
            } catch (e) {
                console.error("Failed to parse AI recommendation JSON", e);
            }
        }

        return { text: cleanText, recommendedMealId, recommendedRestaurantId };
    } catch (error) {
        console.error("AI Error:", error);
        return { text: "Kitchen busy! Please ask again. 🍳" };
    }
};
