import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agendamento } from './agendamento.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { ServicesModule } from '../services/services.module';
import { BarbersModule } from '../barbers/barbers.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agendamento]),
    ServicesModule,
    BarbersModule,
    TenantsModule,
    ScheduleModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
