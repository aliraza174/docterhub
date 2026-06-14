import React, { useEffect, useState } from 'react';

// 1. Line Chart Component
export function SVGLineChart({ data = [], height = 200 }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(1), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)' }}>No data available</div>;

  const maxVal = Math.max(...data.map(d => d.value), 100);
  const minVal = 0;
  const range = maxVal - minVal;

  const paddingX = 40;
  const paddingY = 20;
  const chartHeight = height - paddingY * 2;

  // Calculate points
  const points = data.map((d, index) => {
    const x = paddingX + (index * (100 - (paddingX * 2) / 100) * 8); // Spread across X
    const y = paddingY + chartHeight - ((d.value - minVal) / range) * chartHeight;
    return { x, y, label: d.label, val: d.value };
  });

  // Spread coordinates
  const width = paddingX + (data.length - 1) * 80 + paddingX;
  const pathData = points.reduce((acc, p, i) => {
    const targetY = paddingY + chartHeight - (((p.val - minVal) / range) * chartHeight * animatedProgress);
    return i === 0 ? `M ${p.x} ${targetY}` : `${acc} L ${p.x} ${targetY}`;
  }, '');

  const areaData = points.length > 0 
    ? `${pathData} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-pink)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent-pink)" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingY + chartHeight * ratio;
          const valLabel = Math.round(maxVal - ratio * range);
          return (
            <g key={idx}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <text x={paddingX - 10} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">{valLabel}</text>
            </g>
          );
        })}

        {/* Shaded Area Under Line */}
        {areaData && (
          <path d={areaData} fill="url(#chartGlow)" style={{ transition: 'all 0.8s ease' }} />
        )}

        {/* Trend Line */}
        {pathData && (
          <path
            d={pathData}
            fill="none"
            stroke="var(--accent-pink)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'all 0.8s ease' }}
          />
        )}

        {/* Interactive Data Nodes */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={paddingY + chartHeight - (((p.val - minVal) / range) * chartHeight * animatedProgress)}
              r="4"
              fill="var(--bg-primary)"
              stroke="var(--accent-pink)"
              strokeWidth="2.5"
              style={{ transition: 'all 0.8s ease' }}
            />
            {/* Tooltip Hover Value */}
            <text
              x={p.x}
              y={paddingY + chartHeight - (((p.val - minVal) / range) * chartHeight * animatedProgress) - 10}
              fill="var(--text-primary)"
              fontSize="10"
              fontWeight="600"
              textAnchor="middle"
              style={{ opacity: animatedProgress }}
            >
              ${p.val}
            </text>
            {/* X Axis Label */}
            <text x={p.x} y={height - 2} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// 2. Bar Chart Component
export function SVGBarChart({ data = [], height = 180 }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(1), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!data || data.length === 0) return <div style={{ color: 'var(--text-muted)' }}>No data available</div>;

  const maxVal = Math.max(...data.map(d => d.value), 10);
  const paddingX = 30;
  const paddingY = 20;
  const chartHeight = height - paddingY * 2;
  const barWidth = 24;
  const gap = 32;

  const width = paddingX + data.length * (barWidth + gap) - gap + paddingX;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
        {/* Horizontal subtle lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingY + chartHeight * ratio;
          return (
            <line key={idx} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          );
        })}

        {data.map((d, idx) => {
          const x = paddingX + idx * (barWidth + gap);
          const ratio = d.value / maxVal;
          const currentBarHeight = chartHeight * ratio * animatedProgress;
          const y = paddingY + chartHeight - currentBarHeight;

          return (
            <g key={idx} className="bar-group">
              {/* Rounded Rounded Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={currentBarHeight}
                rx={12}
                ry={12}
                fill="url(#barGrad)"
                style={{ transition: 'all 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67)' }}
              />
              {/* Value display */}
              <text x={x + barWidth / 2} y={y - 6} fill="var(--text-primary)" fontSize="10" textAnchor="middle" fontWeight="bold">
                {d.value}
              </text>
              {/* Label */}
              <text x={x + barWidth / 2} y={height - 2} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-pink)" />
            <stop offset="100%" stopColor="var(--accent-purple)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// 3. Radial Progress / Donut Indicator
export function SVGRadialProgress({ value = 75, title = "Satisfaction", subtitle = "Overall patient rating" }) {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={strokeWidth}
          />
          {/* Active progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="url(#radialGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out',
            }}
          />
          <defs>
            <linearGradient id="radialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-pink)" />
              <stop offset="100%" stopColor="var(--accent-purple)" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '22px',
          fontFamily: 'var(--font-heading)',
          fontWeight: '800',
          color: 'var(--text-primary)'
        }}>
          {value}%
        </div>
      </div>
      <div>
        <h4 style={{ fontSize: '18px', marginBottom: '4px' }}>{title}</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{subtitle}</p>
      </div>
    </div>
  );
}
