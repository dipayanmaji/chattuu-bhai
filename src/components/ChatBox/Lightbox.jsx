import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";

// full screen image viewer (data: urls cannot be opened in a new tab by browsers)
const Lightbox = ({ src, onClose }) => {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return createPortal(
        <div onClick={onClose} role="dialog" aria-modal="true" aria-label="Image viewer" className="fixed inset-0 z-[100] bg-black/85 grid place-items-center p-4 cursor-zoom-out">
            <button onClick={onClose} className="absolute top-4 right-4 text-3xl text-white" title="Close" aria-label="Close"><MdClose /></button>
            <img src={src} alt="full size" onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full rounded-lg cursor-default" />
        </div>,
        document.body
    );
};

export default Lightbox;
