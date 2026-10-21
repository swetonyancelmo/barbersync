import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expediente } from './expediente.entity';
import { ExpedienteBarbeiro } from './expediente-barbeiro.entity';
import { FolgaBarbeiro } from './folga-barbeiro.entity';
import { Agendamento } from '../appointments/agendamento.entity';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { BarbersModule } from '../barbers/barbers.module';

@Module({
  imports: [
    // Agendamento: só leitura, p/ recusar folga em dia com agendamento ativo.
    TypeOrmModule.forFeature([Expediente, ExpedienteBarbeiro, FolgaBarbeiro, Agendamento]),
    TenantsModule,
    BarbersModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
