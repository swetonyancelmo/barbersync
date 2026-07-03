import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pagamento } from './pagamento.entity';
import { Agendamento } from '../appointments/agendamento.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pagamento, Agendamento]),
    LoyaltyModule,
    AppointmentsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
