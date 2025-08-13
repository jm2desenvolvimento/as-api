import { IsString, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @IsString()
  identifier: string; // email ou cpf
 
  @IsString()
  @MinLength(6)
  password: string;
} 