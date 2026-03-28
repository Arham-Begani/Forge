import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    background: 'linear-gradient(135deg, #0d0d0c 0%, #1a1918 50%, #0d0d0c 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '"DM Sans", sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Grid Background Pattern */}
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0.05,
                    }}
                    width='1200'
                    height='630'
                >
                    <defs>
                        <pattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'>
                            <path d='M 40 0 L 0 0 0 40' fill='none' stroke='#e8e4dc' strokeWidth='1' />
                        </pattern>
                    </defs>
                    <rect width='1200' height='630' fill='url(#grid)' />
                </svg>

                {/* Floating Status Cards Background */}
                <div
                    style={{
                        position: 'absolute',
                        top: '40px',
                        left: '60px',
                        width: '180px',
                        height: '100px',
                        background: 'rgba(11, 11, 11, 0.6)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 0 20px rgba(76, 175, 80, 0.2)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#4CAF50',
                        }}
                    >
                        99
                    </div>
                    <div style={{ fontSize: '12px', color: '#b0aca4', marginTop: '4px' }}>
                        Performance
                    </div>
                </div>

                <div
                    style={{
                        position: 'absolute',
                        top: '180px',
                        right: '80px',
                        width: '180px',
                        height: '100px',
                        background: 'rgba(11, 11, 11, 0.6)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 0 20px rgba(76, 175, 80, 0.2)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#4CAF50',
                        }}
                    >
                        100
                    </div>
                    <div style={{ fontSize: '12px', color: '#b0aca4', marginTop: '4px' }}>
                        SEO Score
                    </div>
                </div>

                <div
                    style={{
                        position: 'absolute',
                        bottom: '40px',
                        left: '80px',
                        width: '180px',
                        height: '100px',
                        background: 'rgba(11, 11, 11, 0.6)',
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 0 20px rgba(76, 175, 80, 0.2)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#4CAF50',
                        }}
                    >
                        Secure
                    </div>
                    <div style={{ fontSize: '12px', color: '#b0aca4', marginTop: '4px' }}>
                        Security
                    </div>
                </div>

                {/* Main Content */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        textAlign: 'center',
                    }}
                >
                    {/* Logo & Brand */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '24px',
                        }}
                    >
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                background: 'linear-gradient(135deg, #C4975A 0%, #D4924A 100%)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                                fontWeight: '900',
                                color: '#111110',
                            }}
                        >
                            ⚡
                        </div>
                        <div
                            style={{
                                fontSize: '32px',
                                fontWeight: '900',
                                color: '#faf9f6',
                                letterSpacing: '-1px',
                            }}
                        >
                            Forze
                        </div>
                    </div>

                    {/* Main Heading */}
                    <h1
                        style={{
                            fontSize: '56px',
                            fontWeight: '900',
                            color: '#faf9f6',
                            margin: '0 0 12px 0',
                            lineHeight: '1.2',
                            maxWidth: '900px',
                        }}
                    >
                        Build Smarter AI Features
                    </h1>

                    {/* Sub Heading */}
                    <p
                        style={{
                            fontSize: '20px',
                            color: '#b0aca4',
                            margin: '0',
                            maxWidth: '800px',
                            lineHeight: '1.4',
                        }}
                    >
                        Surgical Edit Mode • Smart Questions • Real-time Forge
                    </p>
                </div>

                {/* Gradient Accent Line */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '4px',
                        background: 'linear-gradient(90deg, #C4975A 0%, #4CAF50 50%, #C4975A 100%)',
                    }}
                />
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    )
}
