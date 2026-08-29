import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

// Load environment variables (like API keys)
dotenv.config({ path: '../.env' }); 


@Injectable()
export class GatewayService {
    private ai: GoogleGenAI;

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
        // Initialize the Gemini SDK. It automatically looks for process.env.GEMINI_API_KEY
        this.ai = new GoogleGenAI({});
    }
    
    async processPrompt(prompt: string) {
        // 1. Check if we already have the answer in the cache
        // We use the prompt itself as the "key" to look it up

        const cachedResponse = await this.cacheManager.get(prompt);
        
        if(cachedResponse) {
            console.log('Gateway: Returning CACHED response! ⚡️');
            return {
                routedTo: 'Cache',
                message: cachedResponse,
            };
        }
        // 2. If it's not in the cache, proceed with normal routing
        const isComplex = this.isComplexQuery(prompt);

        if(isComplex){
            // Route to LangGraph Agent Core (Phase 2)
            console.log('Gateway: Routing to LangGraph Agent (Complex)');
            return {
                routedTo: 'Agent Core',
                message: 'This requires deep research. Sending to LangGraph Agent.',
                // We will call the Python API here later
            };
        }
        else {
            // Route to fast, cheap model
            console.log('Gateway: Routing to Gemini Flash (Simple)');
            const response = await this.callGeminiFlash(prompt);

            // 3. Save the new answer to the cache for next time! (Default expiration is usually a few minutes)
            await this.cacheManager.set(prompt, response);

            return {
                routedTo: 'Gemini 3.6 Flash',
                message: response,
            };
        }
    }

    // A helper function to call the fast model
    private async callGeminiFlash(prompt: string): Promise<string> {
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
            });
            return response.text || "No response generated";
        } catch (error) {
            console.error("Error calling Gemini: ", error);
            return "Error: Could not reach the LLM.";
        }
    }

    // A simple rule-based router to determine complexity
    private isComplexQuery(prompt: string): boolean {
        const complexKeywords = ['research', 'analyze', 'compare', 'report', 'deep dive'];
        const lowerPrompt = prompt.toLowerCase();

        return complexKeywords.some(keyword => lowerPrompt.includes(keyword));
    }

}

