import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GatewayController } from './gateway.controller.js';
import { GatewayService } from './gateway.service.js';
import { Chat, ChatSchema } from './schemas/chat.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }])
  ],
  controllers: [GatewayController],
  providers: [GatewayService]
})
export class GatewayModule {}