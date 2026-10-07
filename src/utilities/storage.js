// localStorage helpers that never throw (private mode, blocked storage, bad JSON)
export const load = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
};

export const save = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* ignore */ }
};

// Private secret that proves who you are. It never leaves this browser except to join the chat;
// everybody else only sees the public user id the server derives from it.
export const getSecret = () => {
    let secret = load('chattuu_secret', null);
    if (!secret || !/^[a-f0-9]{32,128}$/.test(secret)) {
        const bytes = new Uint8Array(32);
        if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
        else bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
        secret = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        save('chattuu_secret', secret);
    }
    return secret;
};
