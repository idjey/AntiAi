import { IsArray, IsString, ArrayNotEmpty, ArrayMaxSize } from 'class-validator';

export class VerifyBatchDto {
    @IsArray()
    @ArrayNotEmpty()
    @ArrayMaxSize(50) // Limit batch size to prevent abuse
    @IsString({ each: true })
    youtubeVideoIds: string[];
}
