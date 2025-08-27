import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove propriedades não decoradas
    forbidNonWhitelisted: false, // Não falha se houver propriedades extras
    transform: true, // Transforma tipos automaticamente
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:5173', 'https://agenda.jm2.tec.br'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
