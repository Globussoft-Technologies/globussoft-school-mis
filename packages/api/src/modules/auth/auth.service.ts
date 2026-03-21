import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens(stored.user);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if not found to prevent email enumeration
      return { message: 'If this email exists, an OTP has been sent.' };
    }

    // Delete existing tokens for this email
    await this.prisma.passwordResetToken.deleteMany({ where: { email } });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.prisma.passwordResetToken.create({
      data: { email, otp, expiresAt },
    });

    // Log OTP to console (email service is disabled)
    console.log(`[PASSWORD RESET] OTP for ${email}: ${otp} (expires in 15 min)`);

    return { message: 'If this email exists, an OTP has been sent.' };
  }

  async verifyResetOtp(email: string, otp: string) {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: { email, otp, used: false },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Return a temporary signed token for the reset step
    const resetToken = this.jwtService.sign(
      { email, purpose: 'password-reset' },
      { expiresIn: '10m' },
    );

    return { resetToken, message: 'OTP verified successfully' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: { email, otp, used: false },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { used: true },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);

    return { message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(user: { id: string; email: string; role: string; schoolId: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
