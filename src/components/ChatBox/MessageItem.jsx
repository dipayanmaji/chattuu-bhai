import React, { useEffect, useRef, useState } from "react";
import { MdReply, MdClose, MdEdit, MdDelete, MdAddReaction } from "react-icons/md";
import Lightbox from "./Lightbox";
import { getTime } from "../../utilities/usefullJS";
import { resolveImage } from "../../utilities/image";
import { renderMessage, findImageUrls } from "../../utilities/linkify";
import { REACTIONS, MAX_MESSAGE_LENGTH } from "../../utilities/config";

const actionBtn = "h-6 w-6 grid place-items-center rounded-full dark:hover:bg-white/20 hover:bg-black/10 text-[16px]";

const MessageItem = ({ msg, userId, onReply, onEdit, onDelete, onReact, onUserClick, onJump }) => {
    const [open, setOpen] = useState(false);
    const [picker, setPicker] = useState(false);
    const [editing, setEditing] = useState(false);
    const [viewing, setViewing] = useState(false);
    const [shownUrls, setShownUrls] = useState([]); // external images the reader chose to load
    const [draft, setDraft] = useState('');
    const editRef = useRef(null);

    useEffect(() => { if (editing) editRef.current?.focus(); }, [editing]);

    if (msg.system) {
        return (
            <div className="w-full text-center text-xs dark:text-zinc-400 text-white/80 py-1">
                <span className="px-3 py-1 rounded-full dark:bg-gray-900/40 bg-black/10">{msg.message}</span>
            </div>
        );
    }

    const mine = msg.userId === userId;
    const imageUrls = msg.deleted ? [] : findImageUrls(msg.message);
    const reactions = Object.entries(msg.reactions || {});
    const imageSrc = resolveImage(msg.image);
    const host = (url) => { try { return new URL(url).hostname; } catch (e) { return 'the web'; } };
    const toggleOpen = () => { setOpen((o) => !o); setPicker(false); };

    const startEdit = () => { setDraft(msg.message); setEditing(true); setOpen(false); };
    const saveEdit = async () => {
        const text = draft.trim();
        if (text !== msg.message.trim() && (text || msg.image)) await onEdit(msg.id, text);
        setEditing(false);
    };
    const confirmDelete = () => {
        if (window.confirm("Delete this message for everyone?")) onDelete(msg.id);
    };
    const react = (emoji) => { onReact(msg.id, emoji); setPicker(false); setOpen(false); };

    return (
        <div id={`msg-${msg.id}`} className={`group w-full flex ${mine ? 'justify-end' : 'justify-start'}`}>
            <div
                onClick={toggleOpen}
                onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleOpen(); }
                }}
                tabIndex={0}
                onMouseLeave={() => setPicker(false)}
                className={`relative ${open || picker ? 'z-20' : ''} max-w-[85%] min-w-[7rem] rounded-xl px-4 pt-2 pb-1.5 border dark:border-white/10 border-transparent dark:text-white text-neutral-800 ${mine ? 'dark:bg-sky-900/40 bg-white/50' : 'dark:bg-gray-900/50 bg-white/30'}`}
            >
                {msg.deleted ?
                    <div className="italic opacity-60 text-sm">🚫 This message was deleted</div>
                    :
                    <>
                        <div className="break-words">
                            {/* small name on its own line, message text starts below it */}
                            {mine ?
                                <div className="username text-xs leading-4 mb-0.5">You</div>
                                :
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUserClick(msg); }}
                                    className="username block text-xs leading-4 mb-0.5 hover:underline"
                                    title="Send a private message"
                                >{msg.username}</button>
                            }

                            {msg.replyTo &&
                                <div
                                    onClick={(e) => { e.stopPropagation(); onJump(msg.replyTo.id); }}
                                    className="my-1 px-2 py-1 rounded border-l-4 dark:border-sky-300 border-fuchsia-600 dark:bg-white/5 bg-black/10 text-sm cursor-pointer"
                                >
                                    <div className="font-semibold">{msg.replyTo.username}</div>
                                    <div className="opacity-80 truncate">{msg.replyTo.text}</div>
                                </div>
                            }

                            {editing ?
                                <div onClick={(e) => e.stopPropagation()}>
                                    <textarea
                                        ref={editRef}
                                        value={draft}
                                        maxLength={MAX_MESSAGE_LENGTH}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                                            if (e.key === 'Escape') setEditing(false);
                                        }}
                                        className="w-full min-w-[12rem] mt-1 rounded-lg px-2 py-1 outline-none dark:bg-gray-950/80 bg-white/70 dark:text-white text-black"
                                        rows={2}
                                    />
                                    <div className="text-xs opacity-70">Enter to save · Esc to cancel</div>
                                </div>
                                :
                                (msg.message && renderMessage(msg.message))
                            }
                        </div>

                        {msg.image &&
                            <img
                                src={imageSrc}
                                alt="shared"
                                loading="lazy"
                                onClick={(e) => { e.stopPropagation(); setViewing(true); }}
                                className="mt-2 max-h-64 rounded-lg cursor-zoom-in"
                            />
                        }
                        {/* images linked from other sites only load on request: loading one tells its host your IP address */}
                        {imageUrls.map((url) => shownUrls.includes(url) ?
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer nofollow" onClick={(e) => e.stopPropagation()}>
                                <img src={url} alt="linked" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="mt-2 max-h-64 rounded-lg" />
                            </a>
                            :
                            <button
                                key={url}
                                onClick={(e) => { e.stopPropagation(); setShownUrls((u) => [...u, url]); }}
                                className="mt-2 block text-sm px-3 py-1 rounded-lg dark:bg-white/10 bg-black/10 hover:opacity-80"
                            >🖼 Load image from {host(url)}</button>
                        )}

                        {reactions.length > 0 &&
                            <div className="flex flex-wrap gap-1 mt-2">
                                {reactions.map(([emoji, users]) =>
                                    <button
                                        key={emoji}
                                        onClick={(e) => { e.stopPropagation(); onReact(msg.id, emoji); }}
                                        className={`text-xs px-2 py-0.5 rounded-full border ${users.includes(userId) ? 'dark:border-sky-300 border-fuchsia-600 dark:bg-sky-300/20 bg-fuchsia-600/20' : 'dark:border-white/20 border-black/20'}`}
                                    >{emoji} {users.length}</button>
                                )}
                            </div>
                        }
                    </>
                }

                <div className="mt-1 text-xs opacity-80 text-right whitespace-nowrap">
                    {msg.edited && !msg.deleted && "edited · "}{getTime(msg.createdAt)}
                </div>

                {/* hover (desktop) / tap (mobile) actions; the bar turns into the emoji picker */}
                {!msg.deleted && !editing &&
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute -top-8 ${mine ? 'right-0' : 'left-0'} z-30 items-center gap-0.5 px-1.5 h-8 whitespace-nowrap rounded-full dark:bg-gray-900 bg-white shadow-lg border dark:border-white/10 border-black/10 dark:text-white text-neutral-700 ${open || picker ? 'flex' : 'hidden md:group-hover:flex group-focus-within:flex'}`}
                    >
                        {picker ?
                            <>
                                {REACTIONS.map((e) => <button key={e} className="text-lg h-7 w-7 hover:scale-125 transition" aria-label={`React with ${e}`} onClick={() => react(e)}>{e}</button>)}
                                <button className={actionBtn} title="Close" aria-label="Close" onClick={() => setPicker(false)}><MdClose /></button>
                            </>
                            :
                            <>
                                <button className={actionBtn} title="React" aria-label="React" onClick={() => setPicker(true)}><MdAddReaction /></button>
                                <button className={actionBtn} title="Reply" aria-label="Reply" onClick={() => { onReply(msg); setOpen(false); }}><MdReply /></button>
                                {mine && <button className={actionBtn} title="Edit" aria-label="Edit" onClick={startEdit}><MdEdit /></button>}
                                {mine && <button className={actionBtn} title="Delete" aria-label="Delete" onClick={confirmDelete}><MdDelete /></button>}
                            </>
                        }
                    </div>
                }
            </div>
            {viewing && <Lightbox src={imageSrc} onClose={() => setViewing(false)} />}
        </div>
    );
};

export default React.memo(MessageItem);
