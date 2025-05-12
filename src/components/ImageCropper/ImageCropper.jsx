import React, { useRef, useState, useEffect, useCallback } from 'react';

//utils
import {
    calculateCropArea,
    calculateImageDimensions,
    getCanvasAspectRatio,
    getCropHandles,
    getCropWidthLimits,
} from '../../utils/imageCropperUtils.js';

//CSS
import './ImageCropper.scss';

//Icons
import { ZoomIn, ZoomOut, Pipette } from 'lucide-react';

/**
 * @prop {Object} data
 *     The image data object. Must include an `image` property containing a base64 or image URL string.
 *     Example: { image: 'data:image/png;base64,...' } or { image: 'https://example.com/image.jpg' }
 *
 * @prop {number} width
 *     Width of the canvas in pixels. Default is 400.
 *
 * @prop {number} height
 *     Height of the canvas in pixels. Default is 400.
 *
 * @prop {number} resolutionScale
 *     Multiplier for canvas resolution (used for high-DPI rendering). Default is 4.
 *     Example: if width=400 and resolutionScale=4, actual canvas will be 1600px wide.
 *
 * @prop {Object} cropSettings
 *     Settings to enable/disable and customize crop box behavior and appearance.
 *     - enabled: {boolean} Whether cropping is enabled (true/false).
 *     - slider: {boolean} Whether to show a crop size slider (true/false).
 *     - cropBoxStrokeColor: {string} Stroke color of the crop box.
 *     - cropBoxStrokeWidth: {number} Stroke width of the crop box.
 *     - handleFillColor: {string} Fill color of resize handles.
 *     - handleStrokeColor: {string} Stroke color of resize handles.
 *     - handleSize: {number} Size of crop handles in pixels.
 *
 * @prop {function} onChange
 *     Callback function triggered whenever the crop or zoom changes.
 *     It receives an object with the following shape:
 *     {
 *         croppedImage: <base64 PNG string>,
 *         zoomLevel: <number>,
 *         backgroundColor: <string>,
 *         ...cropSettings
 *     }
 */


const ImageCropper = ({
                          data = {},
                          width = 400,
                          height = 400,
                          resolutionScale = 4,
                          cropSettings = {
                              enabled: true,
                              slider: false,
                              cropBoxStrokeColor: '#0072BC',
                              cropBoxStrokeWidth: 4,
                              handleFillColor: '#0072BC',
                              handleStrokeColor: '#0072BC',
                              handleSize: 16,
                          },
                          onChange,
                      }) => {
    const { image } = data;
    const canvasRef = useRef(null);
    const imageRef = useRef(new Image());

    // Crop state in percentage relative to canvas
    const [crop, setCrop] = useState({ x: 0, y: 0, width: 50, height: 50 });
    const [zoom, setZoom] = useState(1);
    const [interaction, setInteraction] = useState(null);
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');

    const aspectRatio = getCanvasAspectRatio(width, height);
    const { MIN_CROP_WIDTH, MAX_CROP_WIDTH } = getCropWidthLimits(width, height, aspectRatio);

    // Converts percentage-based crop to pixel dimensions
    const getPixelCrop = useCallback(() => {
        return {
            x: (crop.x / 100) * width,
            y: (crop.y / 100) * height,
            width: (crop.width / 100) * width,
            height: (crop.height / 100) * height,
        };
    }, [crop, width, height]);

    // Initialize crop box when component mounts or settings change
    useEffect(() => {
        if (!cropSettings.enabled) return;
        const initialCropWidth = width * 0.5;
        const initialCrop = calculateCropArea(initialCropWidth, width, height, aspectRatio);
        setCrop({
            x: (initialCrop.x / width) * 100,
            y: (initialCrop.y / height) * 100,
            width: (initialCrop.width / width) * 100,
            height: (initialCrop.height / height) * 100,
        });
    }, [cropSettings.enabled, width, height, aspectRatio]);

    // Load image when source changes
    useEffect(() => {
        if (image) {
            imageRef.current.src = image;
            imageRef.current.onload = () => {
                renderCanvas();
            };
        }
    }, [image]);

    // Handle background color change
    const handleBackgroundColorChange = (e) => {
        setBackgroundColor(e.target.value);
    };

    // Draw the image and crop area on the canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current.complete) return;

        const ctx = canvas.getContext('2d');
        canvas.width = width * resolutionScale;
        canvas.height = height * resolutionScale;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(resolutionScale, 0, 0, resolutionScale, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // Fill canvas with background color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Draw the image with zoom and centering
        const { renderWidth, renderHeight, offsetX, offsetY } = calculateImageDimensions(
            imageRef.current,
            width,
            height
        );
        const zoomedWidth = renderWidth * zoom;
        const zoomedHeight = renderHeight * zoom;
        const zoomedOffsetX = offsetX + (renderWidth - zoomedWidth) / 2;
        const zoomedOffsetY = offsetY + (renderHeight - zoomedHeight) / 2;

        ctx.drawImage(imageRef.current, zoomedOffsetX, zoomedOffsetY, zoomedWidth, zoomedHeight);

        // Draw the crop box and handles
        if (cropSettings.enabled) {
            const pixelCrop = getPixelCrop();
            ctx.strokeStyle = cropSettings.cropBoxStrokeColor;
            ctx.lineWidth = cropSettings.cropBoxStrokeWidth / resolutionScale;
            ctx.strokeRect(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

            const handles = getCropHandles(pixelCrop, cropSettings, resolutionScale);
            handles.forEach(({ x, y }) => {
                ctx.fillStyle = cropSettings.handleFillColor;
                ctx.strokeStyle = cropSettings.handleStrokeColor;
                ctx.lineWidth = cropSettings.cropBoxStrokeWidth / resolutionScale;
                const handleSize = cropSettings.handleSize / resolutionScale;
                ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
                ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            });
        }
    }, [crop, zoom, cropSettings, width, height, resolutionScale, getPixelCrop, backgroundColor]);

    // Output cropped image to onChange callback
    const triggerOnChange = useCallback(async () => {
        if (!onChange || !imageRef.current.complete || !cropSettings.enabled) return;

        const pixelCrop = getPixelCrop();
        const { renderWidth, renderHeight, offsetX, offsetY } = calculateImageDimensions(
            imageRef.current,
            width,
            height
        );
        const zoomedWidth = renderWidth * zoom;
        const zoomedHeight = renderHeight * zoom;
        const zoomedOffsetX = offsetX + (renderWidth - zoomedWidth) / 2;
        const zoomedOffsetY = offsetY + (renderHeight - zoomedHeight) / 2;

        const scaleX = imageRef.current.width / renderWidth;
        const scaleY = imageRef.current.height / renderHeight;

        const srcX = ((pixelCrop.x - zoomedOffsetX) / zoom) * scaleX;
        const srcY = ((pixelCrop.y - zoomedOffsetY) / zoom) * scaleY;
        const srcWidth = (pixelCrop.width / zoom) * scaleX;
        const srcHeight = (pixelCrop.height / zoom) * scaleY;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width;
        cropCanvas.height = height;
        const ctx = cropCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(
            imageRef.current,
            srcX,
            srcY,
            srcWidth,
            srcHeight,
            0,
            0,
            width,
            height
        );

        const croppedBase64 = cropCanvas.toDataURL('image/png');
        onChange({
            ...cropSettings,
            croppedImage: croppedBase64,
            zoomLevel: zoom,
            backgroundColor,
        });
    }, [crop, zoom, cropSettings, width, height, onChange, getPixelCrop, backgroundColor]);

    // Redraw and emit onChange whenever crop, zoom, or background changes
    useEffect(() => {
        renderCanvas();
        triggerOnChange();
    }, [crop, zoom, backgroundColor, renderCanvas, triggerOnChange]);

    // Start interaction (drag/resize) on mouse down
    const handleMouseDown = (e) => {
        if (!cropSettings.enabled) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * width;
        const y = ((e.clientY - rect.top) / rect.height) * height;

        const pixelCrop = getPixelCrop();
        const handles = getCropHandles(pixelCrop, cropSettings, resolutionScale);
        const handleSize = cropSettings.handleSize / resolutionScale;

        for (const handle of handles) {
            if (Math.abs(x - handle.x) < handleSize && Math.abs(y - handle.y) < handleSize) {
                setInteraction({ type: 'resize', handle: handle.name, startX: x, startY: y });
                return;
            }
        }

        if (
            x >= pixelCrop.x &&
            x <= pixelCrop.x + pixelCrop.width &&
            y >= pixelCrop.y &&
            y <= pixelCrop.y + pixelCrop.height
        ) {
            setInteraction({ type: 'drag', startX: x, startY: y });
        }
    };

    // Update crop during mouse move
    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * width;
        const y = ((e.clientY - rect.top) / rect.height) * height;

        if (interaction) {
            const pixelCrop = getPixelCrop();

            if (interaction.type === 'drag') {
                const dx = ((x - interaction.startX) / width) * 100;
                const dy = ((y - interaction.startY) / height) * 100;

                setCrop((prev) => {
                    let newX = Math.max(0, Math.min(prev.x + dx, 100 - prev.width));
                    let newY = Math.max(0, Math.min(prev.y + dy, 100 - prev.height));
                    return { ...prev, x: newX, y: newY };
                });

                setInteraction((prev) => ({ ...prev, startX: x, startY: y }));
            } else if (interaction.type === 'resize') {
                const newCrop = resizeCrop(
                    x,
                    y,
                    pixelCrop,
                    interaction.handle,
                    width,
                    height,
                    aspectRatio,
                    MIN_CROP_WIDTH,
                    MAX_CROP_WIDTH
                );
                setCrop({
                    x: (newCrop.x / width) * 100,
                    y: (newCrop.y / height) * 100,
                    width: (newCrop.width / width) * 100,
                    height: (newCrop.height / height) * 100,
                });
            }
        } else {
            updateCursor(x, y);
        }
    };

    // End interaction on mouse up
    const handleMouseUp = () => {
        setInteraction(null);
        if (canvasRef.current) {
            canvasRef.current.style.cursor = 'default';
        }
    };

    // Update cursor style based on hover area
    const updateCursor = (x, y) => {
        const pixelCrop = getPixelCrop();
        const handles = getCropHandles(pixelCrop, cropSettings, resolutionScale);
        const handleSize = cropSettings.handleSize / resolutionScale;

        for (const handle of handles) {
            if (Math.abs(x - handle.x) < handleSize && Math.abs(y - handle.y) < handleSize) {
                const cursorMap = {
                    tl: 'nwse-resize',
                    br: 'nwse-resize',
                    tr: 'nesw-resize',
                    bl: 'nesw-resize',
                    l: 'ew-resize',
                    r: 'ew-resize',
                    t: 'ns-resize',
                    b: 'ns-resize',
                };
                canvasRef.current.style.cursor = cursorMap[handle.name] || 'default';
                return;
            }
        }

        if (
            x >= pixelCrop.x &&
            x <= pixelCrop.x + pixelCrop.width &&
            y >= pixelCrop.y &&
            y <= pixelCrop.y + pixelCrop.height
        ) {
            canvasRef.current.style.cursor = 'move';
        } else {
            canvasRef.current.style.cursor = 'default';
        }
    };

    // Handle resize operations for each crop handle
    const resizeCrop = (
        x,
        y,
        pixelCrop,
        handle,
        canvasWidth,
        canvasHeight,
        aspectRatio,
        minCropWidth,
        maxCropWidth
    ) => {
        const handlers = {
            br: () => {
                let width = x - pixelCrop.x;
                width = Math.max(minCropWidth, Math.min(width, canvasWidth - pixelCrop.x));
                const height = width / aspectRatio;
                return { ...pixelCrop, width, height };
            },
            tl: () => {
                let width = pixelCrop.x + pixelCrop.width - x;
                width = Math.max(minCropWidth, Math.min(width, pixelCrop.x + pixelCrop.width));
                const height = width / aspectRatio;
                const newX = pixelCrop.x + pixelCrop.width - width;
                const newY = pixelCrop.y + pixelCrop.height - height;
                return { x: newX, y: newY, width, height };
            },
            tr: () => {
                let width = x - pixelCrop.x;
                width = Math.max(minCropWidth, Math.min(width, canvasWidth - pixelCrop.x));
                const height = width / aspectRatio;
                const newY = pixelCrop.y + pixelCrop.height - height;
                return { x: pixelCrop.x, y: newY, width, height };
            },
            bl: () => {
                let width = pixelCrop.x + pixelCrop.width - x;
                width = Math.max(minCropWidth, Math.min(width, pixelCrop.x + pixelCrop.width));
                const height = width / aspectRatio;
                const newX = pixelCrop.x + pixelCrop.width - width;
                return { x: newX, y: pixelCrop.y, width, height };
            },
            t: () => {
                let height = pixelCrop.y + pixelCrop.height - y;
                height = Math.max(minCropWidth / aspectRatio, Math.min(height, pixelCrop.y + pixelCrop.height));
                const width = height * aspectRatio;
                const newX = pixelCrop.x + (pixelCrop.width - width) / 2;
                return { x: newX, y, width, height };
            },
            b: () => {
                let height = y - pixelCrop.y;
                height = Math.max(minCropWidth / aspectRatio, Math.min(height, canvasHeight - pixelCrop.y));
                const width = height * aspectRatio;
                const newX = pixelCrop.x + (pixelCrop.width - width) / 2;
                return { x: newX, y: pixelCrop.y, width, height };
            },
            l: () => {
                let width = pixelCrop.x + pixelCrop.width - x;
                width = Math.max(minCropWidth, Math.min(width, pixelCrop.x + pixelCrop.width));
                const height = width / aspectRatio;
                const newY = pixelCrop.y + (pixelCrop.height - height) / 2;
                return { x, y: newY, width, height };
            },
            r: () => {
                let width = x - pixelCrop.x;
                width = Math.max(minCropWidth, Math.min(width, canvasWidth - pixelCrop.x));
                const height = width / aspectRatio;
                const newY = pixelCrop.y + (pixelCrop.height - height) / 2;
                return { x: pixelCrop.x, y: newY, width, height };
            },
        };

        return handlers[handle]?.() || pixelCrop;
    };

    // Zoom control handlers
    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.1, 3));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.1, 0.5));
    };

    // Crop size slider (if enabled)
    const handleCropWidthChangeBySlider = (e) => {
        const pixelWidth = parseFloat(e.target.value);
        const newCrop = calculateCropArea(pixelWidth, width, height, aspectRatio);
        setCrop({
            x: (newCrop.x / width) * 100,
            y: (newCrop.y / height) * 100,
            width: (newCrop.width / width) * 100,
            height: (newCrop.height / height) * 100,
        });
    };

    // Render nothing if image is not available
    if (!image) return null;

    return (
        <div className="image-cropper-container">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ border: '1px solid #ccc', cursor: 'default' }}
            />
            <div className="image-cropper-controls">
                <div className="image-cropper-btn">
                    <ZoomIn onClick={handleZoomIn} disabled={zoom >= 3} className="zoom-btn" />
                    <ZoomOut onClick={handleZoomOut} disabled={zoom <= 0.5} className="zoom-btn" />
                </div>
                <div className="background-color-picker">
                    <label htmlFor="backgroundColor"><Pipette /></label>
                    <input
                        type="color"
                        id="backgroundColor"
                        value={backgroundColor}
                        onChange={handleBackgroundColorChange}
                    />
                </div>
            </div>
            {cropSettings.slider && (
                <input
                    type="range"
                    min={MIN_CROP_WIDTH}
                    max={MAX_CROP_WIDTH}
                    value={(crop.width / 100) * width}
                    step={1}
                    onChange={handleCropWidthChangeBySlider}
                    style={{ width: '100%', marginTop: '10px' }}
                />
            )}
        </div>
    );
};

export default ImageCropper;
