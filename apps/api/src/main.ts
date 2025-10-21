import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger as NestLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import * as bodyParser from 'body-parser';

(async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  app.enableCors();
  app.set('trust proxy', 1);

  app.use(
    bodyParser.json({
      limit: 1e8 + 'mb',
      verify: (req: any, res, buf) => (req.rawBody = buf.toString()),
    }),
  );
  app.use(bodyParser.urlencoded({ limit: 1e8 + 'mb', extended: true }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  NestLogger.log(`API is running on: http://localhost:${port}/${globalPrefix}`);
})();
