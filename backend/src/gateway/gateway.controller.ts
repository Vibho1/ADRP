import { Controller, Post, Body, Get, Query} from '@nestjs/common';
import { GatewayService } from './gateway.service.js';

@Controller('gateway')
export class GatewayController {
    constructor(private readonly gatewayService: GatewayService) {}

    @Post('prompt')
    async handlePrompt(@Body() body: { prompt: string; userEmail: string }) {
        return this.gatewayService.processPrompt(body.prompt, body.userEmail);
    }

    // Remember to add @Get and @Query to your imports at the top!
    @Get('history')
    async getHistory(@Query('email') email: string) {
        return this.gatewayService.getHistory(email);
    }

}