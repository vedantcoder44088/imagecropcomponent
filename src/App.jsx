import React, { useState } from 'react';
import ImageCropper from './components/ImageCropper/ImageCropper.jsx';

const App = () => {
    const [base64Image, setBase64Image] = useState(null);
    const [cropSettings, setCropSettings] = useState({
        enabled: true,
        slider: false,
        cropBoxStrokeColor: 'blue',
        cropBoxStrokeWidth: 4,
        handleFillColor: 'blue',
        handleStrokeColor: 'blue',
        handleSize: 12,
    });
    const [croppedImage, setCroppedImage] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setBase64Image(reader.result); // base64 string
        };
        reader.readAsDataURL(file);
    };

    const handleCropSettingsChange = (updatedSettings) => {
        setCropSettings(updatedSettings);
        if (updatedSettings.croppedImage) {
            setCroppedImage(updatedSettings.croppedImage);
        }
    };

    const handleDownload = () => {
        if (!croppedImage) return;

        const link = document.createElement('a');
        link.href = croppedImage; // The base64 image string
        link.download = 'cropped-image.png'; // Default name for the download
        link.click(); // Trigger the download
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Image Cropper Example</h1>

            <input type="file" accept="image/*" onChange={handleFileChange} />

            {base64Image && (
                <div style={{ marginTop: '20px' }}>
                    <ImageCropper
                        data={{ image: base64Image }}
                        width={900}
                        height={400}
                        resolutionScale={2}
                        cropSettings={cropSettings}
                        onChange={handleCropSettingsChange}
                    />
                </div>
            )}

            {croppedImage && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Cropped Preview:</h2>
                    <img src={croppedImage} alt="Cropped" style={{ maxWidth: '100%' }} />

                    <button onClick={handleDownload} style={{ marginTop: '20px' }}>
                        Download Cropped Image
                    </button>
                </div>
            )}
        </div>
    );
};

export default App;
