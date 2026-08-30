import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ADD THIS LINE: Allows our frontend to talk to the backend
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
