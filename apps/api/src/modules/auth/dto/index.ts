import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class SignupDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    @MinLength(3)
    @Matches(/^[a-z0-9_]+$/, { message: 'Handle must be lowercase alphanumeric with underscores only' })
    handle: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}
export * from './change-password.dto';
