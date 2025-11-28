import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';
import { SuccessResponseInterceptor } from './exceptions/succes-response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Interceptor chuẩn hoá response
  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  // app.use('/github/webhooks', bodyParser.raw({ type: '*/*' }));

  const config = new DocumentBuilder()
    .setTitle('Project Operation Hub API')
    .setDescription('API documentation for the project operation hub system')
    .setVersion('1.0')
    .addTag('tag')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  document.security = [{ bearer: [] }];
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Lưu token khi refresh
    }
  });

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
