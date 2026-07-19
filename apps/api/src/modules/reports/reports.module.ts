import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pagamento } from '../payments/pagamento.entity';
import { Agendamento } from '../appointments/agendamento.entity';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ReportsService } from './reports.service';
import { ReportsPdfService } from './reports-pdf.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pagamento, Agendamento]),
    LoyaltyModule,
    TenantsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsPdfService],
})
export class ReportsModule {}
