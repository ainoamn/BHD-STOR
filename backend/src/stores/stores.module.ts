import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Store, User, Product]),
    UploadModule,
  ],
  providers: [StoresService],
  controllers: [StoresController],
  exports: [StoresService],
})
export class StoresModule {}
