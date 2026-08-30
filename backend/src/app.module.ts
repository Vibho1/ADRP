import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { CacheModule } from '@nestjs/cache-manager'; // <-- Add this
import * as dotenv from 'dotenv';

// 1. Load the .env file so NestJS can read the MONGODB_URI
dotenv.config({ path: '../.env' });

@Module({
  imports: [
    GatewayModule,
    CacheModule.register({ isGlobal: true }), // <-- Add this to make cache available everywhere

    MongooseModule.forRoot(process.env.MONGODB_URI as string),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
