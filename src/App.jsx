import React, { useState } from 'react';

//Component
import Modal from './components/Modal/Modal.jsx';
import ImageCropper from './components/ImageCropper/ImageCropper.jsx';
import FileUpload from './components/FileUpload/FileUpload.jsx';

const App = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [croppedImage, setCroppedImage] = useState(null);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]); // Track files
    const [editFileIndex, setEditFileIndex] = useState(null); // Track index of file being edited
    const [tempFile, setTempFile] = useState(null); // Track file being uploaded or edited

    // Handle new file uploads
    const handleFilesChange = (files) => {
        // Do not update selectedFiles immediately; wait for cropping
        const latestFile = files[files.length - 1];
        if (latestFile && !tempFile) {
            const imageUrl = URL.createObjectURL(latestFile);
            setImageToCrop(imageUrl);
            setTempFile(latestFile); // Store the file temporarily
            setIsModalOpen(true); // Open modal
        }
    };

    // Handle edit button click from FileUpload
    const handleEditFile = (file, index) => {
        const imageUrl = URL.createObjectURL(file);
        setImageToCrop(imageUrl);
        setEditFileIndex(index); // Track index of file being edited
        setTempFile(file); // Store the file being edited
        setIsModalOpen(true); // Open modal
    };

    // Handle crop changes from ImageCropper
    const handleCropChange = (data) => {
        setCroppedImage(data.croppedImage);
        console.log("Cropped Data:", data);
    };

    // Handle modal save
    const handleSubmit = async () => {
        if (croppedImage && tempFile) {
            // Convert base64 cropped image to File object
            const response = await fetch(croppedImage);
            const blob = await response.blob();
            const fileName = tempFile.name;
            const croppedFile = new File([blob], fileName, { type: 'image/png' });

            // Update file list
            let updatedFiles = [...selectedFiles];
            if (editFileIndex !== null) {
                // Replace the edited file at editFileIndex
                updatedFiles[editFileIndex] = croppedFile;
            } else {
                // Add new cropped file for initial upload
                updatedFiles = [...updatedFiles, croppedFile];
            }
            setSelectedFiles(updatedFiles);
        } else {
            console.error('Error: No cropped image or temp file available.');
        }

        // Close modal and clean up
        setIsModalOpen(false);
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
        setCroppedImage(null);
        setTempFile(null);
        setEditFileIndex(null);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsModalOpen(false);
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
        setCroppedImage(null);
        setTempFile(null);
        setEditFileIndex(null);
    };

    return (
        <div className="app-container">
            <FileUpload
                accept="image/*"
                allowedTypes={['image/jpeg', 'image/png']}
                maxFiles={10}
                onFilesChange={handleFilesChange}
                onEditFile={handleEditFile}
                dropZoneText="Click to upload image"
                subText="JPG or PNG only"
                files={selectedFiles}
            />

            <Modal
                isOpen={isModalOpen}
                title="Edit Image"
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                showFooter={true}
                submitText="Save"
                cancelText="Cancel"
                showCloseIcon={true}
            >
                {imageToCrop && (
                    <ImageCropper
                        width={400}
                        height={300}
                        data={{ image: imageToCrop }}
                        onChange={handleCropChange}
                    />
                )}
            </Modal>

            {croppedImage && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Preview Cropped Image:</h3>
                    <img src={croppedImage} alt="Cropped" style={{ maxWidth: '100%' }} />
                </div>
            )}
        </div>
    );
};

export default App;
