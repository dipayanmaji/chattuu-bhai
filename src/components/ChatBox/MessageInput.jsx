import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MdClose, MdImage, MdEmojiEmotions, MdFormatBold, MdFormatItalic, MdCode, MdTextFormat } from "react-icons/md";
import EmojiPicker from "./EmojiPicker";
import { prepareImage } from "../../utilities/image";
import { applyFormat } from "../../utilities/format";
import { MAX_MESSAGE_LENGTH } from "../../utilities/config";

const iconBtn = "h-9 w-9 shrink-0 grid place-items-center rounded-full text-[22px] dark:text-sky-300 text-fuchsia-900 transition hover:bg-black/10 dark:hover:bg-white/10";

const FORMATS = [
    { marker: '**', label: 'Bold (Ctrl/Cmd+B)', Icon: MdFormatBold, key: 'b' },
    { marker: '*', label: 'Italic (Ctrl/Cmd+I)', Icon: MdFormatItalic, key: 'i' },
    { marker: '`', label: 'Code (Ctrl/Cmd+E)', Icon: MdCode, key: 'e' }
];

const MessageInput = ({ room, replyTo, onCancelReply, onSend, onTyping, onError }) => {
    const [text, setText] = useState('');
    const [image, setImage] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [sending, setSending] = useState(false);
    const [showFormat, setShowFormat] = useState(false);
    const inputRef = useRef(null);
    const fileRef = useRef(null);
    const typingTimer = useRef(null);
    const isTyping = useRef(false);
    const typingRoom = useRef(room);
    const drafts = useRef({}); // unsent text per conversation
    const textRef = useRef('');
    const pendingSelection = useRef(null); // cursor / selection to restore after a formatting change
    textRef.current = text;

    // each conversation keeps its own unsent text while you look at another one
    useEffect(() => {
        const saved = drafts.current;
        setText(saved[room] || ''); setImage(null); setShowEmoji(false);
        inputRef.current?.focus();
        return () => {
            stopTyping();
            saved[room] = textRef.current;
        };
    }, [room]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { if (replyTo) inputRef.current?.focus(); }, [replyTo]);

    // put the cursor back after the controlled textarea re-rendered with formatted text
    useLayoutEffect(() => {
        if (!pendingSelection.current || !inputRef.current) return;
        const [start, end] = pendingSelection.current;
        pendingSelection.current = null;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(start, end);
    });

    const format = (marker) => {
        const el = inputRef.current;
        if (!el) return;
        const { text: next, selStart, selEnd } = applyFormat(el.value, el.selectionStart, el.selectionEnd, marker);
        if (next.length > MAX_MESSAGE_LENGTH) return;
        pendingSelection.current = [selStart, selEnd];
        setText(next);
    };

    // auto-grow
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = '36px';
        el.style.height = Math.min(el.scrollHeight, 96) + 'px';
    }, [text]);

    const stopTyping = () => {
        clearTimeout(typingTimer.current);
        if (isTyping.current) {
            isTyping.current = false;
            onTyping(false, typingRoom.current);
        }
    };
    useEffect(() => stopTyping, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e) => {
        setText(e.currentTarget.value);
        if (!isTyping.current) {
            isTyping.current = true;
            typingRoom.current = room;
            onTyping(true, room);
        }
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(stopTyping, 2000);
    };

    const submit = async () => {
        inputRef.current?.focus();
        if (sending || (!text.trim() && !image)) return;
        setSending(true);
        stopTyping();
        const ok = await onSend({ text, image, replyTo });
        setSending(false);
        if (ok) {
            drafts.current[room] = '';
            setText(''); setImage(null); setShowEmoji(false);
            onCancelReply();
        }
    };

    const attach = async (file) => {
        try {
            setImage(await prepareImage(file));
        } catch (err) {
            onError(err.message);
        }
    };

    const handlePaste = (e) => {
        const file = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'));
        if (file) {
            e.preventDefault();
            attach(file);
        }
    };

    return (
        <div className="relative w-full px-4 pb-2">
            {showEmoji && <EmojiPicker onPick={(emoji) => { setText((t) => t + emoji); inputRef.current?.focus(); }} />}

            {replyTo &&
                <div className="mb-1 px-3 py-1 rounded-lg flex items-center justify-between dark:bg-gray-950/60 bg-white/50 dark:text-white text-neutral-800 text-sm border-l-4 dark:border-sky-300 border-fuchsia-600">
                    <div className="truncate">
                        <span className="font-semibold">Replying to {replyTo.username}: </span>
                        <span className="opacity-80">{replyTo.message || '📷 Photo'}</span>
                    </div>
                    <button onClick={onCancelReply} className="ml-2 text-lg"><MdClose /></button>
                </div>
            }

            {image &&
                <div className="mb-1 relative inline-block">
                    <img src={image} alt="preview" className="max-h-24 rounded-lg" />
                    <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 h-5 w-5 grid place-items-center rounded-full bg-black/70 text-white text-sm"><MdClose /></button>
                </div>
            }

            {/* phones: formatting row above the input, there is no room for it beside the text box */}
            {showFormat && <div className="sm:hidden flex gap-1 mb-1">
                {FORMATS.map(({ marker, label, Icon }) => (
                    <button
                        key={marker}
                        type="button"
                        title={label}
                        aria-label={label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => format(marker)}
                        className="h-7 w-8 grid place-items-center rounded-lg text-lg dark:bg-gray-950/60 bg-white/50 dark:text-sky-300 text-fuchsia-900"
                    ><Icon /></button>
                ))}
            </div>}

            <div className="flex items-end gap-1 px-2 py-1 rounded-3xl dark:bg-gray-950/80 bg-white/60 backdrop-blur-sm border dark:border-white/10 border-transparent">
                <button type="button" title="Emoji" aria-label="Emoji" onClick={() => setShowEmoji((s) => !s)} className={iconBtn}><MdEmojiEmotions /></button>
                <button type="button" title="Send a photo" aria-label="Send a photo" onClick={() => fileRef.current?.click()} className={iconBtn}><MdImage /></button>
                <button
                    type="button"
                    title="Text formatting"
                    aria-label="Text formatting"
                    aria-expanded={showFormat}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowFormat((v) => !v)}
                    className={`${iconBtn} ${showFormat ? 'dark:bg-sky-300/20 bg-fuchsia-600/20' : ''}`}
                ><MdTextFormat /></button>
                {showFormat && FORMATS.map(({ marker, label, Icon }) => (
                    <button
                        key={marker}
                        type="button"
                        title={label}
                        aria-label={label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => format(marker)}
                        className={`${iconBtn} hidden sm:grid !text-[20px]`}
                    ><Icon /></button>
                ))}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { attach(e.target.files[0]); e.target.value = ''; }} />

                <textarea
                    ref={inputRef}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                        if (e.metaKey || e.ctrlKey) {
                            const f = FORMATS.find((x) => x.key === e.key.toLowerCase());
                            if (f) {
                                e.preventDefault();
                                return format(f.marker);
                            }
                        }
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                    onPaste={handlePaste}
                    value={text}
                    maxLength={MAX_MESSAGE_LENGTH}
                    autoFocus
                    rows={1}
                    placeholder={window.innerWidth >= 640 ? "Message (Shift+Enter for new line)" : "Message"}
                    aria-label="Message"
                    className="resize-none break-words flex-1 min-w-0 max-h-24 h-9 overflow-y-auto bg-transparent dark:text-white text-black dark:placeholder-slate-300/80 placeholder-slate-800/80 px-2 py-[7px] leading-5 outline-none"
                />

                <button
                    onClick={submit}
                    disabled={sending}
                    className="h-9 shrink-0 px-5 rounded-full font-bold dark:bg-sky-300/20 bg-fuchsia-600/20 dark:text-sky-300 text-fuchsia-900 transition hover:opacity-80 active:opacity-70 disabled:opacity-60"
                >
                    Send
                </button>
            </div>
            {text.length > MAX_MESSAGE_LENGTH - 100 &&
                <div className="text-xs text-right pr-2 opacity-80">{text.length}/{MAX_MESSAGE_LENGTH}</div>
            }
        </div>
    );
};

export default MessageInput;
