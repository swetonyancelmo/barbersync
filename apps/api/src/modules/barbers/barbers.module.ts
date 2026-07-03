import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barbeiro } from './barbeiro.entity';
import { User } from '../users/user.entity';
import { Agendamento } from '../appointments/agendamento.entity';
import { BarbersService } from './barbers.service';
import { BarbersController } from './barbers.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Barbeiro, User, Agendamento]),
    TenantsModule,
  ],
  controllers: [BarbersController],
  providers: [BarbersService],
  exports: [BarbersService],
})
export class BarbersModule {}
