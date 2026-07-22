import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Cart,
      CartItem,
      Wishlist,
      Product,
      User,
      Store,
    ]),
  ],
  providers: [OrdersService, CartService, WishlistService],
  controllers: [OrdersController, CartController, WishlistController],
  exports: [OrdersService, CartService, WishlistService],
})
export class OrdersModule {}
