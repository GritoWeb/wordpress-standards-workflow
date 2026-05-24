import { LinkControl } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { Button, Popover } from '@wordpress/components';

/**
 * Link picker wrapping Gutenberg's stock <LinkControl> in a <Popover>.
 *
 * `value` is the standard LinkControl shape — an object with at least
 * `{ url, opensInNewTab }` (plus any extra flags exposed via `settings`,
 * e.g. `nofollow`). Pass it through to/from a block attribute declared
 * as `"type": "object"` in block.json.
 *
 * `onChange` receives the merged value object. `onRemove` resets to an
 * empty link.
 *
 * `settings` is forwarded to LinkControl unchanged — pass `undefined`
 * to use Gutenberg's default (`opensInNewTab` only), or pass an array
 * like `[{id:'opensInNewTab',title:'Open in new tab'},{id:'nofollow',title:'Mark as nofollow'}]`
 * to expose more toggles.
 *
 * Render side: emit `target="_blank"` when `opensInNewTab` is true; WP
 * core's `wp_targeted_link_rel()` filter auto-adds `rel="noopener"` to
 * the final output, so don't hardcode rel attributes from the block.
 *
 * Visual: the trigger button is sized to match the
 * `<div className="p-3 border border-gray-300 rounded bg-white">` input
 * wrapper used by sibling text fields (~46px), so a CTA text input and
 * a CTA link picker line up in a `flex` row.
 */
if (typeof window !== 'undefined' && window.HTMLElement) {
    Object.defineProperty(window.HTMLElement, Symbol.hasInstance, {
        value: (instance) => {
            return !!(instance && typeof instance === 'object' && instance.nodeType === 1);
        },
        configurable: true
    });
}

export const LinkPicker = ({ value, onChange, onRemove, label = '', settings, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const url = value?.url || '';

    const handleRemove = () => {
        if (onRemove) {
            onRemove();
        } else {
            onChange({ url: '', opensInNewTab: false });
        }
    };

    return (
        <div className={className} style={{ position: 'relative' }}>
            {label && (
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    {label}
                </label>
            )}

            <Button
                variant="secondary"
                onClick={() => setIsOpen(!isOpen)}
                className="!w-full !justify-between !min-h-[46px] !px-3 !text-left !bg-white !border !border-gray-300 !rounded !text-gray-700 !shadow-none hover:!bg-gray-50"
            >
                <span className="truncate">{url || 'Select link...'}</span>
            </Button>

            {isOpen && (
                <Popover
                    position="bottom center"
                    onClose={() => setIsOpen(false)}
                >
                    <div style={{ padding: '16px', minWidth: '300px' }}>
                        <LinkControl
                            value={value}
                            onRemove={handleRemove}
                            onChange={(newVal) => onChange({ ...value, ...newVal })}
                            settings={settings}
                        />
                    </div>
                </Popover>
            )}
        </div>
    );
};
