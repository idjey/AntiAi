import { IsString, Length, Matches } from 'class-validator';

export class ChallengeRequestDto {
  @IsString()
  @Length(43, 44)
  @Matches(/^[A-Za-z0-9+/]+={0,2}$/, { message: 'publicKey must be a valid base64 string' })
  publicKey: string;
}
