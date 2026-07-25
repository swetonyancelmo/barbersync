/**
 * Seed de desenvolvimento. Cria uma barbearia demo com admin, barbeiros,
 * serviços, um cliente e alguns agendamentos/pagamentos — o suficiente para
 * exercitar os dois fronts. Rode com: npm run seed --workspace @barbersync/api
 *
 * Em dev (DB_SYNC=true) o próprio seed cria o schema via synchronize.
 * Em produção rode as migrations ANTES (`npm run migration:run`) — com
 * DB_SYNC=false o seed só insere dados, não mexe no schema.
 *
 * ⚠️ Não é idempotente: rodar duas vezes cria uma segunda barbearia demo.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { AppointmentStatus, PaymentMethod, UserRole, pointsFromSpend, tierFromSpend } from '@barbersync/shared';
import { buildDataSourceOptions } from '../config/data-source-options';
import { Tenant } from '../modules/tenants/tenant.entity';
import { User } from '../modules/users/user.entity';
import { Barbeiro } from '../modules/barbers/barbeiro.entity';
import { Servico } from '../modules/services/servico.entity';
import { Agendamento } from '../modules/appointments/agendamento.entity';
import { Pagamento } from '../modules/payments/pagamento.entity';
import { Fidelidade } from '../modules/loyalty/fidelidade.entity';

dotenv.config();

// Mesmo builder do runtime/CLI: garante que o seed cai no banco certo
// (DATABASE_URL em produção, DB_* no docker local).
const ds = new DataSource(buildDataSourceOptions());

async function run() {
  await ds.initialize();
  const hash = await bcrypt.hash('123456', 10);

  // Barbearia + admin
  const tenant = await ds.getRepository(Tenant).save({ nome: 'Barbearia Clássica' });
  await ds.getRepository(User).save({
    nome: 'Dono Admin', email: 'admin@barbersync.com', senhaHash: hash,
    role: UserRole.ADMIN, tenantId: tenant.id, telefone: '(11) 90000-0000',
  });

  // Barbeiros
  const barbUsers = await ds.getRepository(User).save([
    { nome: 'Rafael Souza', email: 'rafael@barbersync.com', senhaHash: hash, role: UserRole.BARBEIRO, tenantId: tenant.id, telefone: '(11) 91111-1111' },
    { nome: 'Lucas Martins', email: 'lucas@barbersync.com', senhaHash: hash, role: UserRole.BARBEIRO, tenantId: tenant.id, telefone: '(11) 92222-2222' },
  ]);
  const barbeiros = await ds.getRepository(Barbeiro).save([
    { userId: barbUsers[0].id, tenantId: tenant.id, especialidade: 'Master', rating: 4.9, ativo: true },
    { userId: barbUsers[1].id, tenantId: tenant.id, especialidade: 'Degradê', rating: 4.7, ativo: true },
  ]);

  // Serviços
  const servicos = await ds.getRepository(Servico).save([
    { tenantId: tenant.id, nome: 'Corte', descricao: 'Corte de cabelo', duracaoMin: 30, preco: 45 },
    { tenantId: tenant.id, nome: 'Barba', descricao: 'Barba completa', duracaoMin: 30, preco: 35 },
    { tenantId: tenant.id, nome: 'Corte + Barba', descricao: 'Combo', duracaoMin: 60, preco: 70 },
  ]);

  // Cliente global
  const cliente = await ds.getRepository(User).save({
    nome: 'João Cliente', email: 'joao@cliente.com', senhaHash: hash,
    role: UserRole.CLIENTE, tenantId: null, telefone: '(11) 93333-3333',
  });

  // Agendamento concluído + pago (gera fidelidade)
  const hoje = new Date();
  const concluido = await ds.getRepository(Agendamento).save({
    tenantId: tenant.id, clienteId: cliente.id, barbeiroId: barbeiros[0].id,
    servicos: [servicos[2]], dataHora: new Date(hoje.getTime() - 86400000),
    status: AppointmentStatus.CONCLUIDO, valorTotal: 70, duracaoTotalMin: 60,
  });
  await ds.getRepository(Pagamento).save({
    tenantId: tenant.id, agendamentoId: concluido.id, forma: PaymentMethod.PIX, valor: 70, pagoEm: new Date(),
  });
  await ds.getRepository(Fidelidade).save({
    clienteId: cliente.id, tenantId: tenant.id,
    totalGastoHistorico: 70, pontosAtuais: pointsFromSpend(70), tier: tierFromSpend(70),
  });

  // Agendamento pendente (aparece em Solicitações)
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(10, 0, 0, 0);
  await ds.getRepository(Agendamento).save({
    tenantId: tenant.id, clienteId: cliente.id, barbeiroId: barbeiros[1].id,
    servicos: [servicos[0]], dataHora: amanha,
    status: AppointmentStatus.PENDENTE, valorTotal: 45, duracaoTotalMin: 30,
  });

  // eslint-disable-next-line no-console
  console.log('Seed concluído.\n  Admin:   admin@barbersync.com / 123456\n  Cliente: joao@cliente.com / 123456');
  await ds.destroy();
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
