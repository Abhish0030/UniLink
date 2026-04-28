import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crop, Move, Search, X } from 'lucide-react';
import { cropImageFile } from '../utils/imageCrop';

const MotionDiv = motion.div;

const ImageCropModal = ({ config, onCancel, onComplete }) => {
  const [zoom, setZoom] = useState(1.15);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!config?.file) return undefined;

    const nextUrl = URL.createObjectURL(config.file);
    setPreviewUrl(nextUrl);
    setZoom(config.initialZoom || 1.15);
    setOffsetX(0);
    setOffsetY(0);

    return () => URL.revokeObjectURL(nextUrl);
  }, [config]);

  const previewStyle = useMemo(() => {
    const scale = zoom;
    const translateX = offsetX / scale;
    const translateY = offsetY / scale;

    return {
      transform: `translate(${translateX}%, ${translateY}%) scale(${scale})`,
      transformOrigin: 'center',
    };
  }, [offsetX, offsetY, zoom]);

  if (!config?.file) {
    return null;
  }

  const aspect = config.aspect || 1;
  const cropShape = config.cropShape || 'rect';
  const fit = config.fit || 'cover';

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const croppedFile = await cropImageFile(config.file, {
        zoom,
        offsetX,
        offsetY,
        aspect,
        fit,
        outputWidth: config.outputWidth,
        outputType: config.outputType || config.file.type || 'image/jpeg',
        fileName: config.file.name,
      });
      onComplete(croppedFile);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        <MotionDiv
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          className="relative w-full max-w-4xl glass-card overflow-hidden"
        >
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-border/70">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-accent">
                    <Crop size={14} />
                    Crop image
                  </div>
                  <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">{config.title || 'Adjust image'}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                    Move and zoom the image so it sits cleanly inside the frame before upload.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-white/70 text-muted hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-[32px] border border-border/80 bg-panel/60 p-4">
                <div
                  className={[
                    'relative mx-auto overflow-hidden bg-ink/8 shadow-inner',
                    cropShape === 'round' ? 'rounded-full' : 'rounded-[28px]',
                    aspect >= 1.6 ? 'w-full max-w-[720px]' : 'w-full max-w-[560px]',
                  ].join(' ')}
                  style={{ aspectRatio: String(aspect) }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Crop preview"
                      className={`absolute inset-0 h-full w-full will-change-transform select-none ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
                      style={previewStyle}
                      draggable="false"
                    />
                  ) : null}
                  <div className="absolute inset-0 border border-white/60" />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="space-y-6">
                <div className="rounded-[28px] border border-border/70 bg-white/70 p-5">
                  <div className="flex items-center gap-2 text-ink">
                    <Search size={17} className="text-primary" />
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em]">Zoom</p>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="mt-4 w-full accent-primary"
                  />
                  <p className="mt-2 text-sm font-semibold text-muted">{zoom.toFixed(2)}x</p>
                </div>

                <div className="rounded-[28px] border border-border/70 bg-white/70 p-5">
                  <div className="flex items-center gap-2 text-ink">
                    <Move size={17} className="text-accent" />
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em]">Position</p>
                  </div>
                  <label className="mt-4 block text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">Horizontal</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={offsetX}
                    onChange={(event) => setOffsetX(Number(event.target.value))}
                    className="mt-2 w-full accent-primary"
                  />
                  <label className="mt-4 block text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">Vertical</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={offsetY}
                    onChange={(event) => setOffsetY(Number(event.target.value))}
                    className="mt-2 w-full accent-primary"
                  />
                </div>

                <div className="rounded-[28px] border border-dashed border-border bg-panel/45 p-5 text-sm font-semibold leading-6 text-muted">
                  Cropping is optional. You can keep the original image or apply the frame-friendly version.
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button type="button" onClick={onCancel} className="btn-secondary text-xs font-extrabold uppercase tracking-[0.18em]">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onComplete(config.file)}
                    className="rounded-2xl border border-border/80 bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-ink transition-colors hover:bg-panel"
                  >
                    Use Original
                  </button>
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={handleApply}
                    className="btn-primary text-xs font-extrabold uppercase tracking-[0.18em]"
                  >
                    {isApplying ? 'Applying...' : 'Apply Crop'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>
    </AnimatePresence>
  );
};

export default ImageCropModal;
