import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema.js';

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

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache, 
        @InjectModel(Chat.name) private chatModel: Model<ChatDocument>
    ) {
        // Initialize the Gemini SDK. It automatically looks for process.env.GEMINI_API_KEY
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    
    // 👇 Notice we added userEmail here!
    async processPrompt(prompt: string, userEmail: string) {
        // 1. Check if we already have the answer in the cache
        const cachedResponse = await this.cacheManager.get(prompt);
        
        if(cachedResponse) {
            console.log('Gateway: Returning CACHED response! ⚡️');
            // (Optional: You could save cache hits to the DB too, but we'll skip it to avoid duplicates)
            return {
                routedTo: 'Cache',
                message: cachedResponse,
            };
        }

        // 2. If it's not in the cache, proceed with normal routing
        const isComplex = this.isComplexQuery(prompt);

        if(isComplex){
            console.log('Gateway: Routing to LangGraph Agent (Complex)');
            
            try {
                // Call the Python FastAPI server
                const agentResponse = await fetch('http://localhost:8000/api/research', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json'},
                    body: JSON.stringify({ prompt }) 
                });

                const agentData = await agentResponse.json();

                await this.cacheManager.set(prompt, agentData.data);

                // 👇 SAVE TO MONGODB!
                await this.saveChat(prompt, agentData.data, userEmail);

                return {
                    routedTo: 'Agent Core',
                    message: agentData.data,
                };
            } catch (error) {
                console.error("Error reaching Python Agent:", error);
                
                // 👇 SAVE THE ERROR TO MONGODB SO WE CAN SEE IT IN UI!
                await this.saveChat(prompt, "Error: The Agent Core is offline or hit a rate limit.", userEmail);

                return {
                    routedTo: 'Agent Core',
                    message: "Error: The Agent Core is offline or hit a rate limit."
                };
            }
        }
        else {
            // Route to fast, cheap model
            console.log('Gateway: Routing to Gemini Flash (Simple)');
            const response = await this.callGeminiFlash(prompt);

            await this.cacheManager.set(prompt, response);

            // 👇 SAVE TO MONGODB!
            await this.saveChat(prompt, response, userEmail);

            return {
                routedTo: 'Gemini 3.6 Flash',
                message: response,
            };
        }
    }

    // --- HELPER FUNCTIONS ---

    // A helper function to save to MongoDB
    private async saveChat(prompt: string, response: string, userEmail: string) {
        if (!userEmail || userEmail === "anonymous") return; // Don't save if not logged in
        
        console.log(`💾 Saving chat to MongoDB for ${userEmail}...`);
        await this.chatModel.updateOne(
          { userEmail: userEmail, title: "Deep Research Chat" }, 
          { 
            $push: { 
              messages: { 
                $each: [
                  { role: "user", content: prompt },
                  { role: "assistant", content: response }
                ] 
              } 
            } 
          },
          { upsert: true } 
        );
    }

    private async callGeminiFlash(prompt: string): Promise<string> {
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
            });
            return response.text || "No response generated";
        } catch (error) {
            console.error("Error calling Gemini: ", error);
            return "Error: Could not reach the LLM. You might have hit a rate limit.";
        }
    }

    async getHistory(userEmail: string) {
        if (!userEmail) return [];
        const chat = await this.chatModel.findOne({ userEmail: userEmail, title: "Deep Research Chat" });
        return chat ? chat.messages : [];
    }


    private isComplexQuery(prompt: string): boolean {
        const complexKeywords = ['research', 'analyze', 'compare', 'report', 'deep dive', 'news', 'weather', 'latest'];
        const lowerPrompt = prompt.toLowerCase();
        return complexKeywords.some(keyword => lowerPrompt.includes(keyword));
    }
}