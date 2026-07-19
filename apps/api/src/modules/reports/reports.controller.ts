import { Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { JwtPayload, UserRole } from '@barbersync/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { resolveTenantId } from '../../common/tenant/tenant-context';
import { TenantsService } from '../tenants/tenants.service';
import { ReportsService } from './reports.service';
import { ReportsPdfService } from './reports-pdf.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('reports')
@Roles(UserRole.ADMIN, UserRole.BARBEIRO)
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly pdf: ReportsPdfService,
    private readonly tenants: TenantsService,
  ) {}

  /** Resumo agregado do período (KPIs, série diária, barbeiros, clientes, serviços). */
  @Get('summary')
  summary(@CurrentUser() user: JwtPayload, @Query() q: ReportQueryDto) {
    return this.reports.summary(resolveTenantId(user), q.periodo, q.data);
  }

  /** Mesmo resumo da tela, em PDF (paridade garantida: reusa summary()). */
  @Get('summary/pdf')
  async summaryPdf(
    @CurrentUser() user: JwtPayload,
    @Query() q: ReportQueryDto,
  ): Promise<StreamableFile> {
    const tenantId = resolveTenantId(user);
    const [tenant, summary] = await Promise.all([
      this.tenants.findById(tenantId),
      this.reports.summary(tenantId, q.periodo, q.data),
    ]);
    const buf = await this.pdf.buildSummaryPdf(summary, tenant.nome);
    return new StreamableFile(buf, {
      type: 'application/pdf',
      disposition: `attachment; filename="relatorio-${q.periodo}-${q.data}.pdf"`,
    });
  }
}
