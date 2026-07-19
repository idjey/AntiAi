import { IsString, IsOptional, Length, Matches, IsEnum } from 'class-validator';

export enum Platform {
  WEB = 'WEB',
  EXTENSION = 'EXTENSION',
  MOBILE = 'MOBILE'
}

export class RegisterIdentityDto {
  @IsString()
  @Length(43, 44)
  @Matches(/^[A-Za-z0-9+/]+={0,2}$/, { message: 'publicKey must be a valid base64 string' })
  publicKey: string;

  @IsString()
  @Length(86, 88)
  @Matches(/^[A-Za-z0-9+/]+={0,2}$/, { message: 'challengeSignature must be a valid base64 string' })
  challengeSignature: string;

  @IsEnum(Platform)
  platform: Platform;

  @IsString()
  @IsOptional()
  deviceAttestationToken?: string;
}
