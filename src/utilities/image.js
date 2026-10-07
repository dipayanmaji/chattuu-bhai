import { SERVER_URL } from './config';

const MAX_SIZE = 600;
const JPEG_QUALITY = 0.6;
const MAX_GIF_BYTES = 700_000;

const readAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.readAsDataURL(file);
});

// returns a (compressed) data url, or throws an Error with a user friendly message
export const prepareImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) throw new Error("Please choose an image file");
    const dataUrl = await readAsDataURL(file);

    // canvas would flatten animated gifs, send them untouched when small enough
    if (file.type === 'image/gif') {
        if (file.size > MAX_GIF_BYTES) throw new Error("GIF is too large (max 700 KB)");
        return dataUrl;
    }

    const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Unsupported image"));
        el.src = dataUrl;
    });

    const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
};

// room messages carry a server relative image path, private ones an inline data url
export const resolveImage = (src) => (src && src.startsWith('/') ? SERVER_URL + src : src);
