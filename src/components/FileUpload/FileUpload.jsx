import React, { useState, useEffect } from 'react';

//CSS
import './FileUpload.scss';

//Icons
import { CloudUpload, CloudDownload, FileImage, Pencil, X } from 'lucide-react';

const FileUpload = ({
                        accept = '*/*',
                        multiple = true,
                        maxFiles = 10,
                        maxFileSize = 10 * 1024 * 1024, // 10 MB
                        allowedTypes = [],
                        customValidator = null,
                        onFilesChange = () => {},
                        onEditFile = () => {},
                        dropZoneText = 'Click to upload',
                        subText = 'Only Images (.jpg or .png)',
                        disabled = false,
                        files = [],
                    }) => {
    const [selectedFiles, setSelectedFiles] = useState(files);
    const [error, setError] = useState('');

    // Sync local state with parent files prop
    useEffect(() => {
        setSelectedFiles(files);
    }, [files]);

    const validateFile = (file) => {
        if (allowedTypes.length && !allowedTypes.includes(file.type)) {
            return `File type "${file.type}" is not allowed.`;
        }
        if (file.size > maxFileSize) {
            return `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(2)} MB.`;
        }
        if (customValidator) {
            const error = customValidator(file);
            if (error) return error;
        }
        return null;
    };

    const handleFileChange = (event) => {
        const newFiles = Array.from(event.target.files);
        const newErrors = [];
        const newValidFiles = [];

        if ((selectedFiles.length + newFiles.length) > maxFiles) {
            setError(`You can only upload up to ${maxFiles} files.`);
            return;
        }

        for (const file of newFiles) {
            const error = validateFile(file);
            if (error) {
                newErrors.push(error);
            } else {
                newValidFiles.push(file);
            }
        }

        if (newErrors.length) {
            setError(newErrors.join(', '));
        } else {
            setError('');
        }

        // Pass all valid files to parent, let App handle modal opening
        const updatedFiles = [...selectedFiles, ...newValidFiles];
        onFilesChange(updatedFiles);
    };

    const handleDownloadFile = (file) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleEditFile = (file, index) => {
        onEditFile(file, index);
    };

    const handleRemoveFile = (fileToRemove) => {
        const updatedFiles = selectedFiles.filter((file) => file !== fileToRemove);
        setSelectedFiles(updatedFiles);
        onFilesChange(updatedFiles);
    };

    return (
        <div className={`file-upload-container ${disabled ? 'disabled' : ''}`}>
            <div className="file-upload-input">
                <label htmlFor="fileInput">
                    <CloudUpload size={30} />
                </label>
                <input
                    type="file"
                    id="fileInput"
                    multiple={multiple}
                    disabled={disabled}
                    accept={accept}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <div className="info-text">{dropZoneText}</div>
                <div className="info-text-sub">{subText}</div>
                {error && <div className="file-upload-error">{error}</div>}
            </div>

            <div className="file-uploaded-files">
                {selectedFiles.length > 0 && (
                    <div>
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="file-uploaded-file-individual">
                                <div className="file-details">
                                    <FileImage size={35} className="file-icon" />
                                    <span>{file.name}</span>
                                </div>
                                <div className="file-btn">
                                    <button onClick={() => handleDownloadFile(file)} title="Download">
                                        <CloudDownload size={25} />
                                    </button>
                                    <button onClick={() => handleEditFile(file, index)} title="Edit">
                                        <Pencil size={25} />
                                    </button>
                                    <button onClick={() => handleRemoveFile(file)} title="Remove">
                                        <X size={25} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
