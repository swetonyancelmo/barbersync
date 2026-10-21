/**
 * @barbersync/shared — contratos compartilhados entre a API (NestJS) e os
 * front-ends (Next.js cliente/admin). Mantém enums e tipos únicos para evitar
 * divergência entre design, backend e telas.
 */

// ---------------------------------------------------------------------------
// Enums de domínio
// ---------------------------------------------------------------------------

export enum UserRole {
  CLIENTE = 'CLIENTE',
  BARBEIRO = 'BARBEIRO',
  ADMIN = 'ADMIN',
}

/** Status de agendamento: Pendente → Confirmado → Concluído (ou Recusado). */
export enum AppointmentStatus {
  PENDENTE = 'PENDENTE',
  CONFIRMADO = 'CONFIRMADO',
  CONCLUIDO = 'CONCLUIDO',
  RECUSADO = 'RECUSADO',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CARTAO = 'CARTAO',
  DINHEIRO = 'DINHEIRO',
}

/** Tier de fidelidade por total gasto histórico (faixas inferidas do design). */
export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  PRATA = 'PRATA',
  OURO = 'OURO',
}

// ---------------------------------------------------------------------------
// Regras de fidelidade (inferidas do design — ver seção 7 do CLAUDE.md).
// Centralizadas aqui para o backend calcular e o front exibir de forma coerente.
// ⚠️ Regra inferida dos prints; confirmar com o Swetony antes de tratar como final.
// ---------------------------------------------------------------------------

export const LOYALTY_RULES = {
  /** 1 ponto a cada R$3 gastos. */
  REAIS_PER_POINT: 3,
  /** Meta de pontos para recompensa (1 serviço grátis). */
  REWARD_THRESHOLD: 250,
  /** Faixas de tier por total gasto histórico (R$). */
  TIER_BANDS: {
    [LoyaltyTier.BRONZE]: { min: 0, max: 199.99 },
    [LoyaltyTier.PRATA]: { min: 200, max: 499.99 },
    [LoyaltyTier.OURO]: { min: 500, max: Infinity },
  },
} as const;

/** Calcula pontos a partir do total gasto (piso). */
export function pointsFromSpend(totalSpend: number): number {
  return Math.floor(totalSpend / LOYALTY_RULES.REAIS_PER_POINT);
}

/** Deriva o tier a partir do total gasto histórico. */
export function tierFromSpend(totalSpend: number): LoyaltyTier {
  if (totalSpend >= LOYALTY_RULES.TIER_BANDS[LoyaltyTier.OURO].min) {
    return LoyaltyTier.OURO;
  }
  if (totalSpend >= LOYALTY_RULES.TIER_BANDS[LoyaltyTier.PRATA].min) {
    return LoyaltyTier.PRATA;
  }
  return LoyaltyTier.BRONZE;
}

// ---------------------------------------------------------------------------
// DTOs / contratos de resposta (subset usado pelos fronts)
// ---------------------------------------------------------------------------

export interface JwtPayload {
  sub: string;
  role: UserRole;
  /** tenant_id só é fixo para BARBEIRO/ADMIN. Para CLIENTE é null (cliente global). */
  tenantId: string | null;
  email: string;
}

// ---------------------------------------------------------------------------
// Expediente / disponibilidade (dias e horários de funcionamento por barbearia)
// ---------------------------------------------------------------------------

/** Bloco de atendimento dentro de um dia (ex.: manhã 09:00–12:00). */
export interface Bloco {
  inicio: string; // 'HH:mm'
  fim: string; // 'HH:mm'
}

/** Configuração de um dia da semana (0 = domingo … 6 = sábado). */
export interface ExpedienteDia {
  diaSemana: number;
  aberto: boolean;
  blocos: Bloco[];
}

export const WEEKDAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

/** Granularidade padrão dos slots gerados na grade de horários (minutos). */
export const SLOT_MINUTES = 30;

/** Expediente padrão quando a barbearia ainda não configurou: seg–sáb, dom fechado. */
export function defaultExpediente(): ExpedienteDia[] {
  return WEEKDAYS.map((_, dia) => ({
    diaSemana: dia,
    aberto: dia !== 0,
    blocos:
      dia === 0
        ? []
        : [
            { inicio: '09:00', fim: '12:00' },
            { inicio: '13:00', fim: '19:00' },
          ],
  }));
}

// ---------------------------------------------------------------------------
// Link de agendamento da barbearia (app.barbersync.com/<slug>)
// ---------------------------------------------------------------------------

/** 3–40 chars: minúsculas, números e hífen; sem hífen nas pontas nem duplo. */
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9]|-(?!-)){1,38}[a-z0-9]$/;

/**
 * Endereços que não podem virar slug: rotas do app do cliente (o slug mora na
 * raiz, `/<slug>`) e nomes que reservamos para o produto. Manter em sincronia
 * ao criar uma rota nova no apps/client.
 */
export const RESERVED_SLUGS: readonly string[] = [
  'home', 'agendar', 'perfil', 'login', 'cadastro', 'offline', 'icons',
  'api', 'admin', 'app', 'www', 'b', 'barbersync', 'painel', 'conta',
  'ajuda', 'suporte', 'sobre', 'termos', 'privacidade', 'contato', 'blog',
  'static', 'public', 'assets', 'manifest', 'sw', 'robots', 'sitemap',
];

/** "Barbearia do Zé!" → "barbearia-do-ze". Não garante unicidade nem tamanho mínimo. */
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

/** Motivo de recusa de um slug, ou null se ele é aceitável. */
export function slugProblem(slug: string): string | null {
  if (!SLUG_REGEX.test(slug)) {
    return 'Use de 3 a 40 caracteres: letras minúsculas, números e hífen.';
  }
  if (RESERVED_SLUGS.includes(slug)) return 'Esse endereço é reservado. Escolha outro.';
  return null;
}

/** Vitrine pública da barbearia — o que o link mostra antes de qualquer login. */
export interface PublicBarbearia {
  id: string;
  nome: string;
  slug: string;
  servicos: {
    id: string;
    nome: string;
    descricao: string | null;
    duracaoMin: number;
    preco: number;
  }[];
  barbeiros: {
    id: string;
    nome: string;
    especialidade: string | null;
    rating: number;
  }[];
}

/** Barbearia como o cliente a guarda/lista (link aberto ou histórico). */
export interface BarbeariaRef {
  id: string;
  nome: string;
  slug: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    nome: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
  };
}

// ---------------------------------------------------------------------------
// Paginação
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Relatórios (aba Relatórios do admin + export PDF)
// ---------------------------------------------------------------------------

export type ReportPeriodo = 'dia' | 'semana' | 'mes';

export interface ReportSummary {
  periodo: { tipo: ReportPeriodo; inicio: string; fim: string };
  kpis: {
    /** Soma dos pagamentos registrados no período (eixo: pago_em). */
    recebido: number;
    /** Agendamentos CONCLUIDO no período (eixo: data_hora). */
    atendimentosConcluidos: number;
    ticketMedio: number;
  };
  /** Um ponto por dia do período, dias sem venda entram com 0. */
  serie: { dia: string; recebido: number; atendimentos: number }[];
  porBarbeiro: { barbeiroId: string; nome: string; atendimentos: number; recebido: number }[];
  topClientes: {
    clienteId: string;
    nome: string;
    atendimentos: number;
    totalGasto: number;
    tier: LoyaltyTier;
  }[];
  /** receitaAprox usa o preço ATUAL do catálogo (não há snapshot por serviço). */
  topServicos: { servicoId: string; nome: string; vezes: number; receitaAprox: number }[];
}
