import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';
import { ConfirmacionEmailService } from '../../aplicacion/servicios/confirmacion-email.service';
import { ConfirmarEmailDto } from '../dtos/confirmar-email.dto';

@Controller('auth')
export class ConfirmacionEmailController {
  constructor(private readonly confirmacionEmailService: ConfirmacionEmailService) {}

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  async confirmarEmail(@Body(new ValidationPipe()) confirmarEmailDto: ConfirmarEmailDto) {
    return this.confirmacionEmailService.confirmarEmail(confirmarEmailDto.token);
  }
} 