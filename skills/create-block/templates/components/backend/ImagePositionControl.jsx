import { useState } from '@wordpress/element';

/**
 * 3x3 grid selector for background image position. Renders a compact
 * dropdown showing 9 anchor positions as directional arrows.
 *
 * Value strings match `object-position` / `background-position` shapes
 * ("top-left", "center", "bottom-right", etc.), so the saved attribute
 * can map straight to CSS in the Blade view.
 */
const POSITIONS = [
    { value: 'top-left',      d: 'M11 11L5 5M5 5H9M5 5V9' },
    { value: 'top-center',    d: 'M8 11V5M5.5 7.5L8 5L10.5 7.5' },
    { value: 'top-right',     d: 'M5 11L11 5M7 5H11V9' },
    { value: 'middle-left',   d: 'M11 8H5M7.5 5.5L5 8L7.5 10.5' },
    { value: 'center',        circle: true },
    { value: 'middle-right',  d: 'M5 8H11M8.5 5.5L11 8L8.5 10.5' },
    { value: 'bottom-left',   d: 'M11 5L5 11M9 11H5V7' },
    { value: 'bottom-center', d: 'M8 5V11M5.5 8.5L8 11L10.5 8.5' },
    { value: 'bottom-right',  d: 'M5 5L11 11M7 11H11V7' },
];

function Arrow({ d, circle }) {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {circle ? <circle cx="8" cy="8" r="2.5" /> : <path d={d} />}
        </svg>
    );
}

export function ImagePositionControl({ value = 'center', onChange, label = 'Position' }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ marginTop: '10px' }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#555',
                    background: 'transparent',
                    border: '1px solid #d5d5d5',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    lineHeight: 1,
                }}
            >
                <span>{label}</span>
                <span style={{ fontSize: '8px', opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2px',
                    marginTop: '4px',
                    padding: '4px',
                    background: '#f0f0f0',
                    borderRadius: '4px',
                }}>
                    {POSITIONS.map((pos) => {
                        const active = value === pos.value;
                        return (
                            <button
                                key={pos.value}
                                type="button"
                                onClick={() => onChange(pos.value)}
                                title={pos.value.replace(/-/g, ' ')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '7px',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    background: active ? '#1e1e1e' : 'transparent',
                                    color: active ? '#fff' : '#444',
                                }}
                            >
                                <Arrow d={pos.d} circle={pos.circle} />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
