import React from 'react';
//Icon
import { X } from 'lucide-react';

//Component
import Button from '../Button/Button.jsx';

//CSS
import './Modal.scss';

const Modal = ({
                   isOpen = false,
                   title = 'Modal',
                   showCloseIcon = true,
                   children,
                   onClose,
                   onSubmit,
                   showFooter = false,
                   submitText = 'Submit',
                   cancelText = 'Cancel',
                   showSubmit = true,
                   showCancel = true,
               }) => {
    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay">
                <div className="modal-container">
                    <div className="modal-header">
                        <div className="modal-header-title">{title}</div>
                        {showCloseIcon && (
                            <div className="modal-header-btn">
                                <X onClick={onClose} />
                            </div>
                        )}
                    </div>

                    <div className="modal-content">{children}</div>

                    {showFooter && (
                        <div className="modal-footer">
                            {showCancel && (
                                <Button
                                    text={cancelText}
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                />
                            )}
                            {showSubmit && (
                                <Button
                                    text={submitText}
                                    type="button"
                                    variant="primary"
                                    onClick={onSubmit}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Modal;
