import { Controller, Post, Body} from '@nestjs/common';
import { GatewayService } from './gateway.service.js';

@Controller('gateway')
export class GatewayController {
    constructor(private readonly gatewayService: GatewayService) {}

    @Post('prompt')
    async handlePrompt(@Body('prompt') prompt: string) {
        console.log(`Received prompt: ${prompt}`);
        
        // Pass the prompt to the service to decide where to route it
        const result = await this.gatewayService.processPrompt(prompt);

        return {
            status: 'success',
            data: result,
        };
    }   
}