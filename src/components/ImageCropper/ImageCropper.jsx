import React, { useRef, useState, useEffect } from 'react';
import {
    calculateCropArea,
    calculateImageDimensions,
    getCanvasAspectRatio,
    getCropHandles,
    getCropWidthLimits
} from "/src/utils/imageCropperUtils.js";

// Component for cropping an image with interactive crop area and optional slider
// @param {Object} props - Component properties
// @param {Object} props.data - Object containing the image data { image: base64 string }
// @param {number} props.width - Canvas width in pixels (default: 400)
// @param {number} props.height - Canvas height in pixels (default: 400)
// @param {number} props.resolutionScale - Scaling factor for canvas resolution (default: 4)
// @param {Object} props.cropSettings - Crop settings configuration
// @param {boolean} props.cropSettings.enabled - Enable/disable cropping functionality (default: true)
// @param {boolean} props.cropSettings.slider - Show/hide crop width adjustment slider (default: true)
// @param {string} props.cropSettings.cropBoxStrokeColor - Stroke color for crop box (default: 'red')
// @param {number} props.cropSettings.cropBoxStrokeWidth - Stroke width for crop box (default: 4)
// @param {string} props.cropSettings.handleFillColor - Fill color for crop handles (default: 'white')
// @param {string} props.cropSettings.handleStrokeColor - Stroke color for crop handles (default: 'black')
// @param {number} props.cropSettings.handleSize - Size of crop handles in pixels (default: 16)
// @param {Function} props.onChange - Callback function to handle crop changes

const ImageCropper = ({
                          data = {},
                          width = 400,
                          height = 400,
                          resolutionScale = 4,
                          cropSettings = {
                              enabled: true,
                              slider: true,
                              cropBoxStrokeColor: 'red',
                              cropBoxStrokeWidth: 4,
                              handleFillColor: 'white',
                              handleStrokeColor: 'black',
                              handleSize: 16,
                          },
                          onChange
                      }) => {
    const { image } = data;
    const imageRef = useRef(new Image());
    const canvasRef = useRef(null);
    const [cropArea, setCropArea] = useState(null);
    const [cropWidthState, setCropWidthState] = useState(width);
    const [interactionState, setInteractionState] = useState(null);
    // Calculate canvas aspect ratio
    const CANVAS_ASPECT_RATIO = getCanvasAspectRatio(width, height);
    // Get minimum and maximum crop width limits
    const { MIN_CROP_WIDTH, MAX_CROP_WIDTH } = getCropWidthLimits(width, height, CANVAS_ASPECT_RATIO);

    // Initialize crop area based on canvas dimensions
    const initializeCropArea = () => {
        const cropAreaData = calculateCropArea(cropWidthState, width, height, CANVAS_ASPECT_RATIO);
        setCropArea(cropAreaData);
    };

    // Handle crop width changes via slider input
    const handleCropWidthChangeBySlider = (e) => {
        const sliderWidth = parseFloat(e.target.value);
        setCropWidthState(sliderWidth);
        const newCropArea = calculateCropArea(sliderWidth, width, height, CANVAS_ASPECT_RATIO);
        setCropArea(newCropArea);
        handleOnChange(newCropArea);
    };

    // Render crop overlay with crop box and handles
    const renderCropOverlay = (ctx) => {
        if (!cropArea) return;

        ctx.strokeStyle = cropSettings.cropBoxStrokeColor;
        ctx.lineWidth = cropSettings.cropBoxStrokeWidth;
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

        const cropHandles = getCropHandles(cropArea, cropSettings, resolutionScale);
        cropHandles.forEach(({ x, y }) => {
            ctx.fillStyle = cropSettings.handleFillColor;
            ctx.fillRect(
                x - cropSettings.handleSize / resolutionScale / 2,
                y - cropSettings.handleSize / resolutionScale / 2,
                cropSettings.handleSize / resolutionScale,
                cropSettings.handleSize / resolutionScale
            );
            ctx.strokeStyle = cropSettings.handleStrokeColor;
            ctx.strokeRect(
                x - cropSettings.handleSize / resolutionScale / 2,
                y - cropSettings.handleSize / resolutionScale / 2,
                cropSettings.handleSize / resolutionScale,
                cropSettings.handleSize / resolutionScale
            );
        });
    };

    // Render image and crop overlay on canvas
    const renderCanvas = () => {
        if (!imageRef.current.complete) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = imageRef.current;

        canvas.width = width * resolutionScale;
        canvas.height = height * resolutionScale;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(resolutionScale, 0, 0, resolutionScale, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const { renderWidth, renderHeight, offsetX, offsetY } = calculateImageDimensions(image, width, height);

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, offsetX, offsetY, renderWidth, renderHeight);
        renderCropOverlay(ctx);
    };

    // Load image and initialize crop area
    useEffect(() => {
        if (image) {
            imageRef.current.src = image;
            imageRef.current.onload = () => {
                if (cropSettings.enabled) {
                    initializeCropArea();
                }
            };
        }
    }, [cropSettings.enabled, image]);

    // Re-render canvas when crop area or image changes
    useEffect(() => {
        if (imageRef.current.complete && cropArea) {
            renderCanvas();
        }
    }, [cropArea, cropWidthState, image]);

    // Handle mouse down to initiate move or resize
    const handleMouseDown = (e) => {
        if (!cropArea) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (width / rect.width);
        const y = (e.clientY - rect.top) * (height / rect.height);

        const cropHandles = getCropHandles(cropArea, cropSettings, resolutionScale);

        for (const handle of cropHandles) {
            const CROP_HANDLE_SIZE = cropSettings.handleSize / resolutionScale;
            if (
                Math.abs(x - handle.x) < CROP_HANDLE_SIZE &&
                Math.abs(y - handle.y) < CROP_HANDLE_SIZE
            ) {
                setInteractionState({ type: 'resize', handle: handle.name });
                return;
            }
        }

        if (
            x >= cropArea.x &&
            x <= cropArea.x + cropArea.width &&
            y >= cropArea.y &&
            y <= cropArea.y + cropArea.height
        ) {
            setInteractionState({ type: 'move', startX: x, startY: y });
        }
    };

    // Handle mouse move for resizing, moving, or cursor updates
    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (width / rect.width);
        const y = (e.clientY - rect.top) * (height / rect.height);

        if (interactionState) {
            if (interactionState.type === 'move') {
                handleMove(x, y);
            } else if (interactionState.type === 'resize') {
                handleResize(x, y);
            }
        } else {
            handleCursorStyle(x, y);
        }
    };

    // Move crop area based on mouse movement
    const handleMove = (x, y) => {
        const dx = x - interactionState.startX;
        const dy = y - interactionState.startY;

        const newX = Math.max(0, Math.min(cropArea.x + dx, width - cropArea.width));
        const newY = Math.max(0, Math.min(cropArea.y + dy, height - cropArea.height));

        setCropArea((prev) => ({ ...prev, x: newX, y: newY }));
        setInteractionState((prev) => ({ ...prev, startX: x, startY: y }));
    };

    // Resize handlers for each crop handle
    const resizeHandlers = {
        br: (x, y) => ({
            width: x - cropArea.x,
            height: (x - cropArea.x) / CANVAS_ASPECT_RATIO,
            x: cropArea.x,
            y: cropArea.y,
        }),
        tl: (x, y) => {
            const width = cropArea.x + cropArea.width - x;
            const height = width / CANVAS_ASPECT_RATIO;
            return {
                width,
                height,
                x,
                y: cropArea.y + cropArea.height - height,
            };
        },
        tr: (x, y) => {
            const width = x - cropArea.x;
            const height = width / CANVAS_ASPECT_RATIO;
            return {
                width,
                height,
                x: cropArea.x,
                y: cropArea.y + cropArea.height - height,
            };
        },
        bl: (x, y) => {
            const width = cropArea.x + cropArea.width - x;
            const height = width / CANVAS_ASPECT_RATIO;
            return {
                width,
                height,
                x,
                y: cropArea.y,
            };
        },
        t: (x, y) => {
            const height = cropArea.y + cropArea.height - y;
            const width = height * CANVAS_ASPECT_RATIO;
            return {
                width,
                height,
                x: cropArea.x + (cropArea.width - width) / 2,
                y,
            };
        },
        b: (x, y) => {
            const height = y - cropArea.y;
            const width = height * CANVAS_ASPECT_RATIO;
            return {
                width,
                height,
                x: cropArea.x + (cropArea.width - width) / 2,
                y: cropArea.y,
            };
        },
        l: (x, y) => {
            const width = cropArea.x + cropArea.width - x;
            const height = width / CANVAS_ASPECT_RATIO;
            return {
                width,
                height,
                x,
                y: cropArea.y + (cropArea.height - height) / 2,
            };
        },
        r: (x, y) => {
            const width = x - cropArea.x;
            const height = width / CANVAS_ASPECT_RATIO;
            return {
                width,
                height,
                x: cropArea.x,
                y: cropArea.y + (cropArea.height - height) / 2,
            };
        },
    };

    // Resize crop area based on handle movement
    const handleResize = (x, y) => {
        const handler = resizeHandlers[interactionState.handle];
        if (!handler) return;

        let { x: newX, y: newY, width: newWidth, height: newHeight } = handler(x, y);

        newWidth = Math.max(MIN_CROP_WIDTH, Math.min(newWidth, width - newX));
        newHeight = newWidth / CANVAS_ASPECT_RATIO;

        if (newX < 0) {
            newX = 0;
            newWidth = cropArea.x + cropArea.width;
            newHeight = newWidth / CANVAS_ASPECT_RATIO;
        }
        if (newY < 0) {
            newY = 0;
            newHeight = cropArea.y + cropArea.height;
            newWidth = newHeight * CANVAS_ASPECT_RATIO;
        }
        if (newX + newWidth > width) {
            newWidth = width - newX;
            newHeight = newWidth / CANVAS_ASPECT_RATIO;
        }
        if (newY + newHeight > height) {
            newHeight = height - newY;
            newWidth = newHeight * CANVAS_ASPECT_RATIO;
        }

        if (newHeight < MIN_CROP_WIDTH / CANVAS_ASPECT_RATIO) {
            newHeight = MIN_CROP_WIDTH / CANVAS_ASPECT_RATIO;
            newWidth = newHeight * CANVAS_ASPECT_RATIO;
        }

        setCropArea({ x: newX, y: newY, width: newWidth, height: newHeight });
        setCropWidthState(newWidth);
    };

    // Handle mouse up to end interaction
    const handleMouseUp = () => {
        setInteractionState(null);
        handleOnChange();
    };

    // Update cursor style based on mouse position
    const handleCursorStyle = (x, y) => {
        const canvas = canvasRef.current;
        const cropHandles = getCropHandles(cropArea, cropSettings, resolutionScale);
        const CROP_HANDLE_SIZE = cropSettings.handleSize / resolutionScale;

        for (const handle of cropHandles) {
            if (
                Math.abs(x - handle.x) < CROP_HANDLE_SIZE &&
                Math.abs(y - handle.y) < CROP_HANDLE_SIZE
            ) {
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
                canvas.style.cursor = cursorMap[handle.name] || 'default';
                return;
            }
        }

        if (
            x >= cropArea.x &&
            x <= cropArea.x + cropArea.width &&
            y >= cropArea.y &&
            y <= cropArea.y + cropArea.height
        ) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'default';
        }
    };

    // Clean up global mouse up event listener
    useEffect(() => {
        const handleMouseUp = () => {
            setInteractionState(null);
            if (canvasRef.current) {
                canvasRef.current.style.cursor = 'default';
            }
        };
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Handle crop area changes and generate cropped image
    const handleOnChange = (customCropArea = cropArea, customCropSettings = cropSettings) => {
        if (!onChange || !imageRef.current.complete || !customCropArea) return;

        const image = imageRef.current;
        const { renderWidth, renderHeight, offsetX, offsetY } = calculateImageDimensions(image, width, height);

        const scaleX = image.width / renderWidth;
        const scaleY = image.height / renderHeight;

        const srcX = (customCropArea.x - offsetX) * scaleX;
        const srcY = (customCropArea.y - offsetY) * scaleY;
        const srcWidth = customCropArea.width * scaleX;
        const srcHeight = customCropArea.height * scaleY;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = width;
        cropCanvas.height = height;

        const ctx = cropCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            srcX, srcY, srcWidth, srcHeight,
            0, 0, width, height
        );

        const croppedBase64 = cropCanvas.toDataURL('image/png');
        onChange({
            ...customCropSettings,
            croppedImage: croppedBase64
        });
    };

    return (
        <div className="image-cropper-container" style={{ position: 'relative', width, height }}>
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    border: '1px solid #ccc',
                    cursor: interactionState ? (interactionState.type === 'move' ? 'move' : 'nse-resize') : 'default',
                }}
            />
            {/* Render slider for crop width adjustment if enabled */}
            {cropSettings.slider && (
                <input
                    type="range"
                    min={MIN_CROP_WIDTH}
                    max={MAX_CROP_WIDTH}
                    value={cropWidthState}
                    step={1}
                    onChange={handleCropWidthChangeBySlider}
                    style={{ width: '100%', marginTop: '10px' }}
                />
            )}
        </div>
    );
};

export default ImageCropper;
