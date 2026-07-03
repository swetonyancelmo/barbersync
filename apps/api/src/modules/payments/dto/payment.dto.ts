import { IsEnum, IsUUID } from 'class-validator';
import { PaymentMethod } from '@barbersync/shared';

export class RegisterPaymentDto {
  @IsUUID()
  agendamentoId: string;

  @IsEnum(PaymentMethod)
  forma: PaymentMethod;
}
