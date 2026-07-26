export const PHASH_CONSTANTS = {
    /**
     * The version of the perceptual hash anchor set.
     * Increment this if the fraction set or matching rules change.
     */
    VERSION: 1,

    /**
     * The fractions of the total video duration to anchor hashes at.
     * 0.2 = 20%, 0.5 = 50%, 0.8 = 80%.
     * Fractional anchoring neutralizes front-trim drift proportionally.
     */
    ANCHOR_FRACTIONS: [0.2, 0.5, 0.8],

    /**
     * The maximum acceptable Hamming distance for a single perceptual hash match.
     * 12 is validated against a robust collision floor of 22 for single 1:1 positional queries.
     */
    THRESHOLD: 12,

    /**
     * The minimum number of anchors that must match <= THRESHOLD for a proof to be verified.
     * 2 out of 3 anchors crushes the false-positive probability while tolerating heavy platform edits.
     */
    MAJORITY_REQUIRED: 2
};
