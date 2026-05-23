import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Image picker used across all blocks. Shows a placeholder when empty;
 * hover over a filled image reveals "Change Image" overlay + corner
 * "Remove image" button (with native confirm).
 *
 * Wrap usage in <MediaUploadCheck> and pass MediaUpload from
 * `@wordpress/block-editor` so this component stays presentational.
 */
export const ImageUploadWithHover = ({
  imageId,
  imageUrl,
  onSelect,
  onRemove,
  MediaUpload,
  height = '380px',
  placeholder = 'Click to select an image',
  buttonText = 'Change Image',
  buttonStyle = 'px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700',
  placeholderBg = 'border-2 border-dashed border-gray-300 rounded hover:border-gray-400 transition-colors',
  placeholderBgColor = 'bg-gray-200',
  widthContainer = '',
  imageClass = '',
}) => {
  return (
    <MediaUpload
      onSelect={onSelect}
      allowedTypes={['image']}
      value={imageId}
      render={({ open }) => (
        <div
          className="flex justify-center relative w-full h-full text-center rounded cursor-pointer"
          onClick={open}
          style={{ height, transition: 'all 0.3s ease', overflow: 'hidden' }}
          onMouseEnter={(e) => {
            if (!imageUrl) return;
            const img = e.currentTarget.querySelector('img');
            const overlay = e.currentTarget.querySelector('.hover-overlay');
            const removeBtn = e.currentTarget.querySelector('.remove-image-btn');
            if (img) img.style.filter = 'brightness(0.5)';
            if (overlay) { overlay.style.opacity = '1'; overlay.style.visibility = 'visible'; }
            if (removeBtn) { removeBtn.style.opacity = '1'; removeBtn.style.visibility = 'visible'; }
          }}
          onMouseLeave={(e) => {
            if (!imageUrl) return;
            const img = e.currentTarget.querySelector('img');
            const overlay = e.currentTarget.querySelector('.hover-overlay');
            const removeBtn = e.currentTarget.querySelector('.remove-image-btn');
            if (img) img.style.filter = 'brightness(1)';
            if (overlay) { overlay.style.opacity = '0'; overlay.style.visibility = 'hidden'; }
            if (removeBtn) { removeBtn.style.opacity = '0'; removeBtn.style.visibility = 'hidden'; }
          }}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt=""
                className={`${imageClass}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', transition: 'filter 0.3s ease' }}
              />
              <div
                className="hover-overlay"
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, visibility: 'hidden', transition: 'all 0.3s ease', zIndex: 10 }}
              >
                <Button variant="primary" className={buttonStyle} onClick={(e) => { e.stopPropagation(); open(); }}>
                  {__(buttonText, 'sage')}
                </Button>
              </div>
              {onRemove && (
                <div
                  className="remove-image-btn"
                  style={{ position: 'absolute', top: '8px', right: '8px', opacity: 0, visibility: 'hidden', transition: 'all 0.3s ease', zIndex: 20 }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(__('Are you sure you want to remove this image?', 'sage'))) {
                        onRemove();
                      }
                    }}
                    aria-label={__('Remove image', 'sage')}
                    style={{ color: '#ffffff', border: 'none', padding: '4px 8px', borderRadius: '4px', background: '#dc2626', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                  >
                    Remove image
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={`flex items-center justify-center w-full h-full ${widthContainer} ${placeholderBg} ${placeholderBgColor}`} style={{ height }}>
              <div className="text-center">
                <div className="mb-2 text-2xl text-gray-400">+</div>
                <p className="mb-2 text-sm text-gray-600">{__(placeholder, 'sage')}</p>
                <Button variant="primary" className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">
                  {__('Add Image', 'sage')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    />
  );
};
