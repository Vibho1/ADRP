import { Controller, Post, Body, Get, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GatewayService } from './gateway.service.js';
import * as pdfParse from 'pdf-parse';


@Controller('gateway')
export class GatewayController {
    constructor(private readonly gatewayService: GatewayService) {}

    @Post('prompt')
    @UseInterceptors(FileInterceptor('file')) // Intercept the "file" field from Frontend
    async handlePrompt(
        @Body() body: { prompt: string; userEmail: string; chatId: string },
        @UploadedFile() file?: any
    ) {
        let documentText = "";

        // If the user uploaded a PDF file, parse it into a simple text string!
        if(file) {
            try {
                // Extract the function whether it's nested in .default or not
                const parse = (pdfParse as any).default || pdfParse;
                const pdfData = await parse(file.buffer);

                documentText = pdfData.text;
                console.log(`📄 Successfully parsed PDF! Extracted ${documentText.length} characters.`);
            } catch (error) {
                console.error("❌ Failed to parse PDF:", error);
            }
        }
        
        return this.gatewayService.processPrompt(body.prompt, body.userEmail, documentText, body.chatId);
    }

    // Remember to add @Get and @Query to your imports at the top!
    @Get('history')
    async getHistory(
        @Query('email') email: string,
        @Query('chatId') chatId: string
    ) {
        return this.gatewayService.getHistory(email, chatId);
    }

    @Get('chats')
    async getAllChats(@Query('email') email: string) {
        return this.gatewayService.getAllChats(email);
    }


}