import React from 'react';

const BrandLogo = ({ size = 36, showSubtitle = true }) => {
	// Brand palette
	const COLOR = {
		navy: '#0D1B2A',
		teal: '#00ACC1',
		tealDark: '#00838F',
		pink: '#E91E63',
		orange: '#FF8A00',
		gray600: '#64748B',
		white: '#FFFFFF',
	};

	const emblemSize = size + 8; // gives emblem a bit more presence than text height

	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 10 }} aria-label="YATRIK ERP">
			{/* Emblem */}
			<svg
				width={emblemSize}
				height={emblemSize}
				viewBox="0 0 96 96"
				role="img"
				focusable="false"
				aria-hidden="true"
				style={{ display: 'block' }}
			>
				<defs>
					<linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor={COLOR.teal} />
						<stop offset="100%" stopColor={COLOR.tealDark} />
					</linearGradient>
					<radialGradient id="headlight" cx="70%" cy="58%" r="30%">
						<stop offset="0%" stopColor={COLOR.orange} stopOpacity="1" />
						<stop offset="100%" stopColor={COLOR.orange} stopOpacity="0" />
					</radialGradient>
				</defs>

				{/* Badge */}
				<circle cx="48" cy="48" r="44" fill="url(#tealGradient)" />

				{/* Subtle road swoosh */}
				<path
					d="M12 66c18-10 36-12 72-4"
					stroke={COLOR.white}
					strokeOpacity="0.9"
					strokeWidth="3.2"
					fill="none"
					strokeLinecap="round"
				/>

				{/* Front bus pictogram (minimal, geometric) */}
				<g transform="translate(18,26)">
					<rect x="0" y="14" width="60" height="26" rx="6" fill={COLOR.white} opacity="0.96" />
					{/* windshield */}
					<rect x="6" y="18" width="36" height="10" rx="3" fill="#CFD8DC" />
					<rect x="44" y="18" width="8" height="10" rx="2" fill="#CFD8DC" />
					{/* brand stripe */}
					<rect x="4" y="33" width="52" height="3.5" rx="1.75" fill={COLOR.pink} />
					{/* wheels */}
					<circle cx="12" cy="44" r="4.8" fill={COLOR.navy} />
					<circle cx="48" cy="44" r="4.8" fill={COLOR.navy} />
					<circle cx="12" cy="44" r="2" fill="#B0BEC5" />
					<circle cx="48" cy="44" r="2" fill="#B0BEC5" />
					{/* headlight glow */}
					<circle cx="56" cy="30" r="10" fill="url(#headlight)" />
					<circle cx="56" cy="30" r="3" fill={COLOR.orange} />
				</g>
			</svg>

			{/* Wordmark */}
			<div style={{ display: 'flex', alignItems: 'baseline', gap: 8, lineHeight: 1 }}>
				<span
					style={{
						fontWeight: 900,
						fontSize: size,
						letterSpacing: '0.5px',
						color: COLOR.navy,
					}}>
					YATRIK
				</span>
				{showSubtitle && (
					<span
						style={{
							display: 'inline-block',
							background: COLOR.pink,
							color: COLOR.white,
							padding: '4px 8px',
							borderRadius: 999,
							fontWeight: 800,
							fontSize: Math.max(12, Math.round(size * 0.45)),
							lineHeight: 1,
							letterSpacing: '0.6px',
						}}
					>
						ERP
					</span>
				)}
			</div>
		</div>
	);
};

export default BrandLogo;
