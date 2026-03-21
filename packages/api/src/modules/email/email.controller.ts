import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailService } from './email.service';

class SendTestEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;
}

@ApiTags('Email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Send a test email (admin only)' })
  async sendTestEmail(@Body() dto: SendTestEmailDto) {
    await this.emailService.sendEmail(dto.to, dto.subject, `<p>${dto.body}</p>`);
    return { success: true, message: `Test email sent to ${dto.to}` };
  }

  @Get('templates')
  @Roles('ADMIN', 'SUPER_ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'List available email templates' })
  getTemplates() {
    return { templates: this.emailService.getAvailableTemplates() };
  }
}
