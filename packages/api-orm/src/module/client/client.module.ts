import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entity/client.entity';
import { OrmClientService } from './service/client.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [OrmClientService],
  exports: [OrmClientService],
})
export class OrmClientModule {}
