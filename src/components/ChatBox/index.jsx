import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { MdMenu, MdVolumeUp, MdVolumeOff } from "react-icons/md";
import useChat, { isDM } from "../../hooks/useChat";
import { getSecret, load, save } from "../../utilities/storage";
import MessageItem from "./MessageItem";
import MessageInput from "./MessageInput";
import Sidebar from "./Sidebar";

const EMPTY = [];

const typingText = (names) => {
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return 'Several people are typing…';
};

const ChatBox = () => {
    const [secret] = useState(getSecret);
    const [userName, setUserName] = useState(() => load('chattuu_username', ''));
    const [nameDraft, setNameDraft] = useState(userName);
    const [red, setRed] = useState(false);
    const [nameError, setNameError] = useState('');
    const [showBtn, setShowBtn] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const userNameRef = useRef(null);
    const msgBoxRef = useRef(null);
    const scrollInfo = useRef({ room: null, first: null, last: null, height: 0 });

    // the server refuses a nickname somebody online is already using
    const handleJoinError = useCallback((res) => {
        if (res.code !== 'name_taken') return;
        save('chattuu_username', '');
        setUserName('');
        setNameError(res.error);
    }, []);

    const chat = useChat({ secret, username: userName, onJoinError: handleJoinError });
    const userId = chat.userId;
    const { activeRoom, messages, typing, dms, hasMore, loadingRoom } = chat;
    const list = messages[activeRoom] || EMPTY;

    const startChat = () => {
        const name = nameDraft.trim().slice(0, 30);
        if (!name) {
            setNameDraft('');
            setRed(true);
            userNameRef.current?.focus();
            return;
        }
        save('chattuu_username', name);
        setUserName(name);
        setRed(false);
        setNameError('');
    };

    const changeName = () => {
        save('chattuu_username', '');
        setNameDraft(userName);
        setNameError('');
        setUserName('');
        setShowSidebar(false);
    };

    const scrollToBottom = () => msgBoxRef.current?.scroll({ top: msgBoxRef.current.scrollHeight, behavior: 'smooth' });

    const scrollBtnHandler = () => {
        const el = msgBoxRef.current;
        if (!el) return;
        setShowBtn(el.scrollHeight > el.clientHeight + el.scrollTop + 100);
    };

    // keep the scroll position sensible: stick to bottom, keep place when older messages load
    useLayoutEffect(() => {
        const el = msgBoxRef.current;
        if (!el) return;
        const p = scrollInfo.current;
        const first = list[0]?.id;
        const lastMsg = list[list.length - 1];
        const last = lastMsg?.id;

        if (p.room !== activeRoom) {
            el.scrollTop = el.scrollHeight;
        } else if (first !== p.first && last === p.last) {
            el.scrollTop += el.scrollHeight - p.height;
        } else if (last !== p.last) {
            const nearBottom = el.scrollTop + el.clientHeight >= p.height - 100;
            if (nearBottom || lastMsg.userId === userId) el.scrollTop = el.scrollHeight;
        }
        scrollInfo.current = { room: activeRoom, first, last, height: el.scrollHeight };
        scrollBtnHandler();
    }, [list, activeRoom, userId]);

    useEffect(() => { setReplyTo(null); }, [activeRoom]);

    const jumpTo = useCallback((id) => {
        const el = document.getElementById(`msg-${id}`);
        if (!el) return chat.setError('That message is not loaded yet. Scroll up to load older messages.');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { sendMessage, editMessage, deleteMessage, react, openDM, setTypingState } = chat;
    const handleUserClick = useCallback((msg) => openDM({ userId: msg.userId, username: msg.username }), [openDM]);

    const typingNames = useMemo(() => Object.values(typing[activeRoom] || {}), [typing, activeRoom]);

    const title = isDM(activeRoom) ? `@ ${dms[activeRoom] || 'Direct message'}` : `# ${activeRoom}`;

    return (
        <div className="w-full max-w-4xl sm:h-[calc(100%-5rem)] h-[calc(100%-4rem)] mx-auto dark:bg-gray-700/20 bg-gray-500/30 sm:rounded-lg relative z-10 overflow-hidden">
            {userName ?
                <div className="w-full h-full flex relative">
                    {/* rooms / direct messages / online users: column on desktop, drawer on mobile */}
                    <div className="hidden md:block w-60 shrink-0 h-full dark:bg-gray-950/40 bg-black/10">
                        <Sidebar
                                channels={chat.channels}
                                dms={dms}
                                online={chat.online}
                                unread={chat.unread}
                                activeRoom={activeRoom}
                                userId={userId}
                                username={userName}
                                onOpenRoom={(room) => { chat.openRoom(room); setShowSidebar(false); }}
                                onJoinChannel={(name) => { chat.joinChannel(name); setShowSidebar(false); }}
                                onLeaveChannel={chat.leaveChannel}
                                onOpenDM={(u) => { openDM(u); setShowSidebar(false); }}
                                onCloseDM={chat.closeDM}
                                onChangeName={changeName}
                                onClose={() => setShowSidebar(false)}
                        />
                    </div>
                    {showSidebar &&
                        <div className="md:hidden absolute inset-0 z-40 flex">
                            <div className="w-64 max-w-[80%] h-full dark:bg-gray-950 bg-fuchsia-900">
                                <Sidebar
                                channels={chat.channels}
                                dms={dms}
                                online={chat.online}
                                unread={chat.unread}
                                activeRoom={activeRoom}
                                userId={userId}
                                username={userName}
                                onOpenRoom={(room) => { chat.openRoom(room); setShowSidebar(false); }}
                                onJoinChannel={(name) => { chat.joinChannel(name); setShowSidebar(false); }}
                                onLeaveChannel={chat.leaveChannel}
                                onOpenDM={(u) => { openDM(u); setShowSidebar(false); }}
                                onCloseDM={chat.closeDM}
                                onChangeName={changeName}
                                onClose={() => setShowSidebar(false)}
                                />
                            </div>
                            <div className="flex-1 bg-black/40" onClick={() => setShowSidebar(false)} />
                        </div>
                    }

                    <div className="flex-1 min-w-0 h-full flex flex-col relative">
                        {/* conversation header */}
                        <div className="h-12 shrink-0 px-4 flex items-center gap-3 dark:bg-gray-900/40 bg-black/10">
                            <button onClick={() => setShowSidebar(true)} aria-label="Open menu" className="md:hidden text-2xl relative">
                                <MdMenu />
                                {Object.values(chat.unread).some((n) => n > 0) && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-fuchsia-600 dark:bg-sky-400" />}
                            </button>
                            <h2 className="font-semibold truncate">{title}</h2>
                            <span className="text-xs opacity-80 hidden sm:inline">{chat.online.length} online</span>
                            <button
                                onClick={() => chat.setMuted(!chat.muted)}
                                title={chat.muted ? "Unmute sounds" : "Mute sounds"}
                                aria-label={chat.muted ? "Unmute sounds" : "Mute sounds"}
                                className="ml-auto text-xl"
                            >
                                {chat.muted ? <MdVolumeOff /> : <MdVolumeUp />}
                            </button>
                        </div>

                        {!chat.connected &&
                            <div className="text-center text-sm py-1 bg-yellow-500/80 text-black">Connecting to the server… messages will sync when it's back.</div>
                        }
                        {isDM(activeRoom) &&
                            <div className="text-center text-xs py-1 dark:bg-gray-900/40 bg-black/10">🔒 Private messages are not saved. They disappear when you refresh or close the tab.</div>
                        }
                        {chat.error &&
                            <div onClick={() => chat.setError('')} className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-red-600 text-white text-sm shadow-lg cursor-pointer max-w-[90%]">{chat.error}</div>
                        }

                        {/* All messages box */}
                        <div
                            ref={msgBoxRef}
                            onScroll={scrollBtnHandler}
                            role="log"
                            aria-live="polite"
                            aria-label="Messages"
                            className="w-full flex-1 px-4 pt-8 pb-2 space-y-3 overflow-y-auto overflow-x-hidden"
                        >
                            {hasMore[activeRoom] &&
                                <div className="text-center">
                                    <button onClick={chat.loadOlder} disabled={loadingRoom} className="text-sm px-3 py-1 rounded-full dark:bg-gray-900/50 bg-white/30 dark:text-white text-neutral-800 disabled:opacity-60">
                                        {loadingRoom ? 'Loading…' : 'Load older messages'}
                                    </button>
                                </div>
                            }

                            {list.length > 0 ?
                                list.map((msg) =>
                                    <MessageItem
                                        key={msg.id}
                                        msg={msg}
                                        userId={userId}
                                        onReply={setReplyTo}
                                        onEdit={editMessage}
                                        onDelete={deleteMessage}
                                        onReact={react}
                                        onUserClick={handleUserClick}
                                        onJump={jumpTo}
                                    />
                                )
                                :
                                <div className="w-full h-full grid place-items-center text-center font-medium text-[18px]">
                                    {loadingRoom ? 'Loading messages…' : `Come on ${userName}!, Hit me with your first message.`}
                                </div>
                            }
                        </div>

                        {/* scroll to latest message btn */}
                        <span
                            onClick={scrollToBottom}
                            className={`absolute right-5 bottom-24 z-20 h-7 w-7 text-[20px] dark:bg-white/30 bg-black/50 rounded-full transition-all duration-500 ${showBtn ? 'opacity-1 visible' : 'opacity-0 invisible'} grid place-items-center cursor-pointer md:hover:opacity-85`}
                        >
                            <IoIosArrowDown />
                        </span>

                        <div className="h-5 px-4 text-xs italic opacity-90 shrink-0">{typingText(typingNames)}</div>

                        <MessageInput
                            room={activeRoom}
                            replyTo={replyTo}
                            onCancelReply={() => setReplyTo(null)}
                            onSend={sendMessage}
                            onTyping={setTypingState}
                            onError={chat.setError}
                        />
                    </div>
                </div>

                :

                <div className="w-full h-full text-center flex flex-col items-center justify-center gap-4">

                    <div>Hi, I am Chattuu. And your name is
                        <input
                            ref={userNameRef}
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onKeyUp={(e) => e.key === "Enter" && startChat()}
                            aria-label="Your nickname"
                            maxLength={30}
                            placeholder="your nickname"
                            autoFocus
                            className={`break-words bg-transparent w-32 mx-2 px-1 text-white ${red ? 'placeholder-red-300' : 'placeholder-slate-300/60'} outline-none border-b-[1px] border-dotted`}
                        />.
                    </div>

                    {nameError && <div className="text-red-200 text-sm max-w-xs">{nameError}</div>}

                    <button
                        onClick={startChat}
                        className="block h-[35px] dark:bg-gray-950/80 bg-white/60 dark:text-sky-300 text-fuchsia-900 font-bold rounded-xl px-4 transition sm:hover:opacity-80 active:opacity-80 backdrop-blur-sm border dark:border-white/10 border-transparent"
                    >Start</button>

                </div>
            }

        </div>
    )
}

export default ChatBox;
