import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entity/property.entity';
import { OrmPropertyService } from './service/property.service';

@Module({
  imports: [TypeOrmModule.forFeature([Property])],
  providers: [OrmPropertyService],
  exports: [OrmPropertyService],
})
export class OrmPropertyModule {}
