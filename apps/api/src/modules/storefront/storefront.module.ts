import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { ServicesModule } from '../services/services.module';
import { BarbersModule } from '../barbers/barbers.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { StorefrontController } from './storefront.controller';

/** Endpoints públicos do link de agendamento da barbearia (sem entity própria). */
@Module({
  imports: [TenantsModule, ServicesModule, BarbersModule, AppointmentsModule],
  controllers: [StorefrontController],
})
export class StorefrontModule {}
