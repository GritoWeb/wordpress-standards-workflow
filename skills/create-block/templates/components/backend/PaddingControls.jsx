import { useState } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl, Button } from '@wordpress/components';
import { PADDING_PRESETS } from './padding-presets.js';

/**
 * Reusable spacing panel for any block. Renders an InspectorControls
 * (sidebar) panel with desktop/mobile breakpoint switcher, vertical
 * spacing slider tied to PADDING_PRESETS, and side-spacing toggle.
 *
 * Required attributes on the block:
 *   paddingVertDesktop, paddingVertMobile,
 *   paddingXDesktop,    paddingXMobile
 *
 * These are already injected into every block by
 * BlockManager::globalAttributes(), so any block can render this
 * panel without declaring its own padding attributes.
 */
export function PaddingControls({ attributes, setAttributes }) {
    const [breakpoint, setBreakpoint] = useState('desktop');

    const isDesktop = breakpoint === 'desktop';
    const presets   = PADDING_PRESETS.vertical[breakpoint];
    const vertKey   = isDesktop ? 'paddingVertDesktop' : 'paddingVertMobile';
    const horizKey  = isDesktop ? 'paddingXDesktop'    : 'paddingXMobile';

    const currentPx    = attributes[vertKey];
    const currentIndex = presets.findIndex((p) => p.px === currentPx);
    const safeIndex    = currentIndex < 0 ? 0 : currentIndex;

    return (
        <InspectorControls>
            <PanelBody title="Spacing" initialOpen={false}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                    <Button
                        isPressed={isDesktop}
                        onClick={() => setBreakpoint('desktop')}
                        size="small"
                        variant="tertiary"
                    >
                        Desktop
                    </Button>
                    <Button
                        isPressed={!isDesktop}
                        onClick={() => setBreakpoint('mobile')}
                        size="small"
                        variant="tertiary"
                    >
                        Mobile
                    </Button>
                </div>

                <RangeControl
                    label={`Vertical Spacing · ${presets[safeIndex]?.label ?? ''}`}
                    value={safeIndex}
                    min={0}
                    max={presets.length - 1}
                    step={1}
                    withInputField={false}
                    marks={presets.map((_, i) => ({ value: i }))}
                    onChange={(index) => setAttributes({ [vertKey]: presets[index].px })}
                    __nextHasNoMarginBottom
                />

                <ToggleControl
                    label="Side Spacing"
                    checked={!!attributes[horizKey]}
                    onChange={(val) => setAttributes({ [horizKey]: val })}
                    help={attributes[horizKey] ? 'Enabled' : 'Disabled'}
                    __nextHasNoMarginBottom
                />
            </PanelBody>
        </InspectorControls>
    );
}
