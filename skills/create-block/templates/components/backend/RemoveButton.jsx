import { __ } from '@wordpress/i18n';

/**
 * Destructive pill button — visually matches the "Remove image" button
 * inside ImageUploadWithHover (white text on red `#dc2626`, 4×8 padding,
 * 4px radius, 12px / 500 weight). Native `window.confirm()` gate before
 * firing `onClick`.
 *
 * Canonical placement for repeater items (TabSelector) is the top-right
 * of the active item's panel:
 *
 *   <div className="flex justify-end mb-2">
 *     <RemoveButton onClick={() => removeItem(activeIdx)} />
 *   </div>
 */
export function RemoveButton({
    label = __('Delete Item', 'sage'),
    confirmMessage,
    onClick,
    disabled = false,
    className = '',
    ...rest
}) {
    const handleClick = (e) => {
        e.stopPropagation();
        const message = confirmMessage ?? `${label}?`;
        if (window.confirm(message)) {
            onClick();
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            aria-label={label}
            className={className}
            style={{
                color: '#ffffff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                background: '#dc2626',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                opacity: disabled ? 0.5 : 1,
            }}
            {...rest}
        >
            {label}
        </button>
    );
}
