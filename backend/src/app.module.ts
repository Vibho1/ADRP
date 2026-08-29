import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { CacheModule } from '@nestjs/cache-manager'; // <-- Add this


@Module({
  imports: [
    GatewayModule,
    CacheModule.register({ isGlobal: true }), // <-- Add this to make cache available everywhere
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
