import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterBarbeariaDto,
  RegisterClienteDto,
} from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('register/cliente')
  registerCliente(@Body() dto: RegisterClienteDto) {
    return this.auth.registerCliente(dto);
  }

  @Public()
  @Post('register/barbearia')
  registerBarbearia(@Body() dto: RegisterBarbeariaDto) {
    return this.auth.registerBarbearia(dto);
  }
}
