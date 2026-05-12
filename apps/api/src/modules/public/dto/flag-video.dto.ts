import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class FlagVideoDto {
    @IsString()
    @IsNotEmpty()
    platform: string;

    @IsString()
    @IsNotEmpty()
    platform_id: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    reason: string;
}
