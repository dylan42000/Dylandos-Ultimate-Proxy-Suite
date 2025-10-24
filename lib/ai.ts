

import { GoogleGenAI, Type } from "@google/genai";
import { ProxyStatus, ProxyType, AnonymityLevel } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

async function callGemini(systemInstruction: string, userPrompt: string, responseSchema: any): Promise<any> {
    const model = 'gemini-2.5-flash';
    try {
        const contents = `${systemInstruction}\n\nUSER_PROMPT:\n${userPrompt}`;

        const response = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                temperature: 0.2,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
}

export async function aiTagProxy(isp: string, country: string): Promise<string[]> {
    const systemInstruction = `
        You are an expert proxy analyst. Based on the ISP and country, classify the proxy with relevant tags.
        Return a JSON array of strings.
        Possible tags: 'datacenter', 'residential', 'mobile'.
        If the ISP name contains terms like 'Cloud', 'Hosting', 'AWS', 'Google', 'Azure', 'OVH', 'Hetzner', 'DigitalOcean', 'Leaseweb', use 'datacenter'.
        If the ISP is a common telecommunication company like 'Comcast', 'Verizon', 'AT&T', 'BT', 'Deutsche Telekom', 'Telefonica', 'Charter', use 'residential'.
        If you are unsure, return an empty array.
    `;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.STRING,
            description: "A relevant tag for the proxy.",
        },
    };
    return callGemini(systemInstruction, `ISP: "${isp}", Country: "${country}"`, schema);
}

export async function parseNaturalLanguageQuery(query: string): Promise<Partial<{
    status: ProxyStatus | 'ALL',
    type: ProxyType | 'ALL',
    anonymity: AnonymityLevel | 'ALL',
    country: string,
    minScore: number,
    maxLatency: number,
    searchText: string
}>> {
    const systemInstruction = `
        You are an intelligent filter parser for a proxy management application.
        Your task is to convert a user's natural language query into a JSON object of filter conditions.
        
        Rules:
        - Analyze the user query for keywords related to these filters.
        - "Fast", "quick", "low latency" should map to a reasonable "maxLatency", e.g., 300.
        - "High quality", "good" should map to a "minScore", e.g., 75.
        - Map country names to their 2-letter ISO codes. If you see a city, infer the country.
        - If a filter is not mentioned, do not include its key in the JSON.
        - If the query includes terms that don't map to a specific filter but could be a general search term (like an ISP name or part of an IP), put it in "searchText".
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            status: { type: Type.STRING, enum: [ProxyStatus.VALID, ProxyStatus.INVALID, ProxyStatus.UNTESTED], nullable: true },
            type: { type: Type.STRING, enum: [ProxyType.HTTP, ProxyType.HTTPS, ProxyType.SOCKS4, ProxyType.SOCKS5], nullable: true },
            anonymity: { type: Type.STRING, enum: [AnonymityLevel.ELITE, AnonymityLevel.ANONYMOUS, AnonymityLevel.TRANSPARENT], nullable: true },
            country: { type: Type.STRING, description: "2-letter ISO country code", nullable: true },
            minScore: { type: Type.INTEGER, description: "Integer between 0 and 100", nullable: true },
            maxLatency: { type: Type.INTEGER, description: "Integer in milliseconds", nullable: true },
            searchText: { type: Type.STRING, description: "General search term", nullable: true },
        },
    };

    return callGemini(systemInstruction, `Parse this query: "${query}"`, schema);
}

export async function analyzeSourceContent(content: string): Promise<{
    format: 'txt' | 'json',
    type: ProxyType,
    jsonPath?: string
}> {
     const systemInstruction = `
        You are an AI that analyzes the content of a proxy list source.
        Your goal is to determine the format ('txt' or 'json') and the proxy protocol type ('HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5').
        The content provided is a snippet from the source URL.
        
        Rules:
        - If the content is clearly JSON, the format is 'json'. Otherwise, assume 'txt'.
        - For JSON, if proxies are nested, suggest a simple 'jsonPath' (e.g., "data.proxies"). If they are at the root, don't include jsonPath.
        - Analyze the proxies themselves. SOCKS proxies are often explicitly mentioned. If no protocol is clear, default to 'HTTP'.
        - Prioritize SOCKS5 > SOCKS4 > HTTPS > HTTP if multiple types seem possible.
    `;
    const snippet = content.substring(0, 2000);
    const schema = {
        type: Type.OBJECT,
        properties: {
            format: { type: Type.STRING, enum: ['txt', 'json'] },
            type: { type: Type.STRING, enum: [ProxyType.HTTP, ProxyType.HTTPS, ProxyType.SOCKS4, ProxyType.SOCKS5] },
            jsonPath: { type: Type.STRING, nullable: true },
        },
        required: ['format', 'type']
    };
    return callGemini(systemInstruction, `Analyze this content snippet:\n\n${snippet}`, schema);
}


export async function generateCheckProfile(goal: string): Promise<string[]> {
     const systemInstruction = `
        You are an AI that helps users configure a proxy checker.
        Based on the user's stated goal, you will suggest a list of relevant URLs to use as check targets.
        
        Rules:
        - The list should contain between 3 and 5 relevant URLs.
        - The URLs should be for well-known, reliable websites related to the user's goal.
        - For example, if the goal is "scraping sneaker sites", suggest sites like nike.com, adidas.com, footlocker.com.
        - If the goal is "social media automation", suggest sites like instagram.com, twitter.com, facebook.com.
        - Include a generic, reliable target like "https://api.ipify.org" or "https://httpbin.org/get" in the list to verify basic connectivity.
    `;

    const schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };

    return callGemini(systemInstruction, `User goal: "${goal}"`, schema);
}