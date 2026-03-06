import { Controller, Get, Query, Param, NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
    constructor(private readonly publicService: PublicService) { }

    /**
     * Main verification endpoint for browser extension
     * GET /public/verify?youtube_video_id=XXXX
     */
    @Get('verify')
    async verify(@Query('youtube_video_id') youtubeVideoId: string) {
        return this.publicService.verifyVideo(youtubeVideoId);
    }

    /**
     * Get active proof token for a video
     * GET /public/proof?youtube_video_id=XXXX
     */
    @Get('proof')
    async getProof(@Query('youtube_video_id') youtubeVideoId: string) {
        const result = await this.publicService.getProofToken(youtubeVideoId);
        if (!result) {
            throw new NotFoundException('No active proof for this video');
        }
        return result;
    }

    /**
     * Get a specific proof by ID
     * GET /public/proofs/:proof_id
     */
    @Get('proofs/:proof_id')
    async getProofById(@Param('proof_id') proofId: string) {
        const result = await this.publicService.getProofById(proofId);
        if (!result) {
            throw new NotFoundException('Proof not found');
        }
        return result;
    }

    /**
     * Get active signing keys for verification
     * GET /public/keys
     */
    @Get('keys')
    async getKeys() {
        return this.publicService.getSigningKeys();
    }

    /**
     * Get Creator Directory (Trending and Recent)
     * GET /public/creators
     */
    @Get('creators')
    async getCreatorDirectory() {
        return this.publicService.getCreatorDirectory();
    }

    /**
     * Get public creator profile by handle (Linktree-style page)
     * GET /public/creators/:handle
     */
    @Get('creators/:handle')
    async getCreatorProfile(@Param('handle') handle: string): Promise<any> {
        const result = await this.publicService.getCreatorProfile(handle);
        if (!result) {
            throw new NotFoundException('Creator not found');
        }
        return result;
    }

    /**
     * Get public creator profile by custom domain (e.g., proof.johndoe.com)
     * GET /public/creators/domain/:domain
     */
    @Get('creators/domain/:domain')
    async getCreatorProfileByDomain(@Param('domain') domain: string): Promise<any> {
        const result = await this.publicService.getCreatorProfileByDomain(domain);
        if (!result) {
            throw new NotFoundException('Creator not found for this domain');
        }
        return result;
    }

}

