import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

export const runtime = 'edge';
export const alt = 'Creator Profile on AntiAI';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

async function getCreator(handle: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/public/creators/${handle}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

export default async function Image({ params }: { params: { handle: string } }) {
    const creator = await getCreator(params.handle);

    if (!creator) {
        return new ImageResponse(
            (
                <div
                    style={{
                        background: 'linear-gradient(to right bottom, #10B981, #047857)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontFamily: 'sans-serif',
                    }}
                >
                    <div style={{ fontSize: 60, fontWeight: 'bold' }}>AntiAI</div>
                    <div style={{ fontSize: 32, marginTop: 20 }}>Profile Not Found</div>
                </div>
            ),
            { ...size }
        );
    }

    const displayName = creator.name || `@${creator.handle}`;
    const avatarUrl = creator.appearance?.profile_image_url || 'https://antiai.me/default-avatar.png'; // Fallback if no avatar
    const primaryColor = creator.appearance?.primary_color || '#10B981';

    // Attempting to lighten/darken or use gradients based on primary color is complex in OG,
    // so we'll use a clean dark theme with the primary color as an accent.
    return new ImageResponse(
        (
            <div
                style={{
                    background: '#0F172A', // Slate 900
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background decorative glows */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '-10%',
                        width: '60%',
                        height: '60%',
                        background: primaryColor,
                        filter: 'blur(100px)',
                        opacity: 0.2,
                        borderRadius: '50%',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-20%',
                        right: '-10%',
                        width: '60%',
                        height: '60%',
                        background: '#3B82F6', // Blue 500
                        filter: 'blur(100px)',
                        opacity: 0.15,
                        borderRadius: '50%',
                    }}
                />

                {/* Main Content Container */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '24px',
                        zIndex: 10,
                    }}
                >
                    {/* Avatar with Ring */}
                    <div
                        style={{
                            display: 'flex',
                            padding: '8px',
                            background: `linear-gradient(to right bottom, ${primaryColor}, #3B82F6)`,
                            borderRadius: '50%',
                            boxShadow: `0 0 40px ${primaryColor}40`,
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            width="200"
                            height="200"
                            style={{
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid #0F172A',
                                background: '#1E293B',
                            }}
                        />
                    </div>

                    {/* Creator Details */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginTop: '20px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 64,
                                fontWeight: 'bold',
                                color: 'white',
                                letterSpacing: '-0.02em',
                                textAlign: 'center',
                            }}
                        >
                            {displayName}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginTop: '16px',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 32,
                                    color: '#94A3B8', // Slate 400
                                }}
                            >
                                @{creator.handle}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Authenticity Badge */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 40,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '12px 24px',
                        borderRadius: '100px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414 4.243 4.243z"
                            fill={primaryColor}
                        />
                    </svg>
                    <span
                        style={{
                            fontSize: 24,
                            fontWeight: 500,
                            color: 'white',
                            letterSpacing: '0.02em',
                        }}
                    >
                        Cryptographically Verified on AntiAI
                    </span>
                </div>
            </div>
        ),
        { ...size }
    );
}
