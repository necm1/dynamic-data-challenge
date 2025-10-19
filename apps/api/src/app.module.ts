import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { OrmModule } from '@repo/orm';
import { resolve } from 'path';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        transport: {
          target: 'pino-pretty',
        },
      },
    }),
    ConfigModule.forRoot({
      envFilePath: [
        resolve(__dirname, `../../../.env.api`),
        resolve(__dirname, '../../../.env'),
      ],
      isGlobal: true,
    }),
    OrmModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
