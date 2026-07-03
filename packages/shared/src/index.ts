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
