import { LinkControl } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { Button, Popover } from '@wordpress/components';

/**
 * Link selector using Gutenberg's stock <LinkControl> in a <Popover>.
 * Supports internal pages (via post search), external URLs, and
 * "Open in new tab" — the new-tab flag is encoded into the URL itself
 * via the `#opensInNewTab` marker so the URL string round-trips through
 * block.json attributes without a paired boolean attribute.
 *
 * On the render side (block.php / Blade), strip the marker and emit
 * `target="_blank" rel="noopener noreferrer"` when present.
 */
if (typeof window !== 'undefined' && window.HTMLElement) {
    Object.defineProperty(window.HTMLElement, Symbol.hasInstance, {
        value: (instance) => {
            return !!(instance && typeof instance === 'object' && instance.nodeType === 1);
        },
        configurable: true
    });
}

export const LinkPicker = ({ url, onChange, label = '', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const hasNewTab = url && url.includes('#opensInNewTab');
    const cleanUrl = url ? url.replace('#opensInNewTab', '') : '';

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
                style={{ width: '100%', justifyContent: 'space-between' }}
            >
                {cleanUrl || 'Select link...'}
            </Button>

            {isOpen && (
                <Popover
                    position="bottom center"
                    onClose={() => setIsOpen(false)}
                >
                    <div style={{ padding: '16px', minWidth: '300px' }}>
                        <LinkControl
                            value={{
                                url: cleanUrl || '',
                                opensInNewTab: !!hasNewTab
                            }}
                            onRemove={() => onChange('')}
                            onChange={(newVal) => {
                                let finalUrl = newVal?.url !== undefined ? newVal.url : cleanUrl;
                                const isNewTab = newVal?.opensInNewTab !== undefined ? newVal.opensInNewTab : hasNewTab;

                                if (isNewTab && finalUrl) {
                                    if (!finalUrl.includes('#opensInNewTab')) {
                                        finalUrl += '#opensInNewTab';
                                    }
                                } else {
                                    finalUrl = finalUrl.replace('#opensInNewTab', '');
                                }
                                onChange(finalUrl);
                            }}
                            settings={[
                                {
                                    id: 'opensInNewTab',
                                    title: 'Open in new tab'
                                }
                            ]}
                        />
                    </div>
                </Popover>
            )}
        </div>
    );
};
