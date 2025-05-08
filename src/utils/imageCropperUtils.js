// Returns the aspect ratio of a canvas, defaulting to 1 if height is 0
export const getCanvasAspectRatio = (width, height) => {
    if (height === 0) return 1; // Prevent division by zero
    return width / height;
};

// Calculates the minimum and maximum crop width based on canvas dimensions and aspect ratio
export const getCropWidthLimits = (canvasWidth, canvasHeight, aspectRatio) => {
    const MIN_CROP_WIDTH = 10;
    const MAX_CROP_WIDTH = Math.min(canvasWidth, canvasHeight * aspectRatio);
    return { MIN_CROP_WIDTH, MAX_CROP_WIDTH };
};

// Determines the scaled dimensions and offsets for rendering an image within a canvas
export const calculateImageDimensions = (image, canvasWidth, canvasHeight) => {
    const imageWidth = image.width;
    const imageHeight = image.height;
    let renderWidth, renderHeight, offsetX, offsetY;

    const widthScale = canvasWidth / imageWidth;
    const heightScale = canvasHeight / imageHeight;
    const scale = Math.min(widthScale, heightScale);
    renderWidth = imageWidth * scale;
    renderHeight = imageHeight * scale;
    offsetX = (canvasWidth - renderWidth) / 2;
    offsetY = (canvasHeight - renderHeight) / 2;

    return { renderWidth, renderHeight, offsetX, offsetY };
};

// Calculates the crop area dimensions and position, ensuring it fits within the image
export const calculateCropArea = (cropWidthState, width, height, aspectRatio) => {
    let cropWidth = cropWidthState;
    let cropHeight = cropWidth / aspectRatio;

    if (cropHeight > height) {
        cropHeight = height;
        cropWidth = height * aspectRatio;
    }

    return {
        x: (width - cropWidth) / 2,
        y: (height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
    };
};

// Generates crop handle positions for resizing the crop area
export const getCropHandles = (cropArea, cropSettings, resolutionScale) => {
    const CROP_HANDLE_SIZE = cropSettings.handleSize / resolutionScale;

    return [
        { name: 'tl', x: cropArea.x, y: cropArea.y }, // Top-left handle
        { name: 'tr', x: cropArea.x + cropArea.width, y: cropArea.y }, // Top-right handle
        { name: 'bl', x: cropArea.x, y: cropArea.y + cropArea.height }, // Bottom-left handle
        { name: 'br', x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height }, // Bottom-right handle
        { name: 't', x: cropArea.x + cropArea.width / 2, y: cropArea.y }, // Top-center handle
        { name: 'b', x: cropArea.x + cropArea.width / 2, y: cropArea.y + cropArea.height }, // Bottom-center handle
        { name: 'l', x: cropArea.x, y: cropArea.y + cropArea.height / 2 }, // Left-center handle
        { name: 'r', x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height / 2 }, // Right-center handle
    ];
};
