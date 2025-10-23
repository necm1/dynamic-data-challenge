import { Module } from '@nestjs/common';
import { OrmClientModule, OrmMetadataModule } from '@repo/api-orm';
import { ClientController } from './controller/client.controller';

@Module({
  imports: [OrmClientModule, OrmMetadataModule],
  controllers: [ClientController],
})
export class ClientModule {}
