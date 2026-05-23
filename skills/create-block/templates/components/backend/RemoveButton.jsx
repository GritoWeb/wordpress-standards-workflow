import { Button } from '@wordpress/components';
import { trash } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Icon-only delete button used across all blocks.
 * Transparent background, gray icon turning red on hover, native
 * window.confirm() dialog before firing onClick.
 */
export function RemoveButton({
    label = 'Delete',
    confirmMessage,
    onClick,
    disabled = false,
    className = '',
    ...rest
}) {
    const handleClick = (e) => {
        e.stopPropagation();
        const message = confirmMessage ?? __(`${label}?`, 'sage');
        if (window.confirm(message)) {
            onClick();
        }
    };

    return (
        <Button
            icon={trash}
            label={label}
            showTooltip
            onClick={handleClick}
            disabled={disabled}
            className={`!bg-transparent hover:!bg-transparent !text-gray-400 hover:!text-red-700 !border-0 !shadow-none !p-0 !w-7 !h-7 !flex !items-center !justify-center transition-colors ${className}`}
            {...rest}
        />
    );
}
