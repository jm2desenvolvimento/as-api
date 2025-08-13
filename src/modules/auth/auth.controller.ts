import { Controller, Post, Body, HttpException, HttpStatus, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Importe o JwtAuthGuard se já existir, ou use um guard equivalente
// import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() credentials: AuthCredentialsDto) {
    const result = await this.authService.validateUser(credentials);
    if (!result) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return result;
  }

  // Endpoint para retornar o perfil do usuário autenticado
  @Get('me')
  // @UseGuards(JwtAuthGuard) // Descomente se já tiver um guard JWT
  async getProfile(@Req() req) {
    // Extrair token do header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new HttpException('Token não fornecido', HttpStatus.UNAUTHORIZED);
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    } catch (e) {
      throw new HttpException('Token inválido ou expirado', HttpStatus.UNAUTHORIZED);
    }
    const userId = payload.sub;
    if (!userId) {
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }
    // Buscar usuário e perfil
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }
    // Buscar permissões
    // Se AuthService tiver método para isso, use, senão busque manualmente
    // Aqui, para simplificar, só retorna user + profile
    return {
      id: user.id,
      email: user.email,
      cpf: user.cpf,
      role: user.role,
      city_id: (user as any).city_id ?? null,
      health_unit_id: (user as any).health_unit_id ?? null,
      profile: user.profile,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
} 