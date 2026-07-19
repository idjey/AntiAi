import { Injectable } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { GroundTruth } from './classification-matrix';

@Injectable()
export class SettlementDomainEvents {
  constructor(private settlement: SettlementService) {}

  /**
   * Called when a creator signs a video (authentic or disclaimer).
   */
  async onSubjectSigned(subjectHash: string, isAuthentic: boolean, metadata?: any) {
    const truth: GroundTruth = {
      type: isAuthentic ? 'CREATOR_SIGNATURE_AUTHENTIC' : 'CREATOR_SIGNATURE_DISCLAIMER',
      payload: metadata,
    };
    await this.settlement.settle(subjectHash, truth);
  }

  /**
   * Called when the provenance worker successfully verifies an original source.
   */
  async onMachineVerifiedProvenance(subjectHash: string, sourceUrl: string) {
    const truth: GroundTruth = {
      type: 'MACHINE_VERIFIED_PROVENANCE',
      payload: { sourceUrl },
    };
    await this.settlement.settle(subjectHash, truth);
  }

  /**
   * Called when an admin explicitly overrides.
   */
  async onAdminAdjudication(subjectHash: string, payload: any) {
    const truth: GroundTruth = {
      type: 'ADMIN_ADJUDICATION',
      payload,
    };
    await this.settlement.settle(subjectHash, truth);
  }
}
