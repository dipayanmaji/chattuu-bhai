import React, { useEffect, useRef, useState } from "react";
import { getTime } from "../utilities/usefullJS";

const ChatBox = () => {
    const [messages, setMessages] = useState([
        {
            text: "hii this is chattuu bhai",
            time: "13/02/2024, 01:03 PM"
        },
        {
            text: "hii Whatsupp",
            time: "13/02/2024, 11:10 PM"
        },
        {
            text: "Hello Brother",
            time: "13/02/2024, 11:03 PM"
        },
        {
            text: "hii this is chattuu bhai",
            time: "12/03/2024, 01:03 PM"
        },
        {
            text: "hii how are you",
            time: "12/03/2024, 10:33 PM"
        },
        {
            text: "hii Whatsupp",
            time: "12/03/2024, 11:10 PM"
        },
        {
            text: "heyy chattuu bhai here",
            time: "13/03/2024, 05:03 PM"
        },
        {
            text: "when you go to bed chattuu bhai!",
            time: "13/03/2024, 03:30 PM"
        },
        {
            text: "hii this is chattuu bhai",
            time: "13/03/2024, 01:03 PM"
        },
    ]);
    const [newMsg, setNewMsg] = useState('');
    const inputRef = useRef(null);
    const msgBoxRef = useRef(null);

    const createMessage = () => {
        inputRef.current.focus();
        if (newMsg.trim() === '') return;

        let time = getTime();

        setMessages([...messages, {
            text: newMsg,
            time: time
        }]);

        setNewMsg('');

        setTimeout(() => {
            msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight);
        }, 1);
    }

    useEffect(() => {
        msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight);
    }, [])

    return (
        <div className="w-full max-w-4xl h-[calc(100%-5rem)] mx-auto dark:bg-gray-700/20 bg-gray-500/30 rounded-lg relative z-10 overflow-hidden">

            {/* All messages box */}
            <div
                ref={msgBoxRef}
                className="w-full h-[calc(100%-3.5rem)] px-4 pt-2 mb-2 space-y-2 overflow-y-auto overflow-x-hidden"
            >
                {
                    messages.map((msg, index) =>
                        <div key={index} id={index} className="w-full min-h-12 dark:bg-gray-900/50 bg-white/30 dark:text-white text-neutral-800 rounded-xl px-4 pt-2 pb-6">
                            <div className="break-words">{msg.text}</div>
                            <span className="text-sm float-end inline-block">{msg.time}</span>
                        </div>
                    )
                }
            </div>

            <div className="w-full h-12 min-h-12 px-4 pb-2 flex items-end">
                <textarea
                    ref={inputRef}
                    onChange={(e) => setNewMsg(e.currentTarget.value)}
                    value={newMsg}
                    autoFocus
                    type="text"
                    placeholder="Message"
                    className="resize-none break-words w-[calc(100%-5rem)] max-h-24 h-[40px] overflow-y-auto dark:bg-gray-950/80 bg-white/60 dark:text-white text-black dark:placeholder-slate-300/80 placeholder-slate-800/80 rounded-l-3xl px-4 py-2 outline-none"
                ></textarea>
                
                <button
                    onClick={createMessage}
                    className="w-20 h-[40px] dark:bg-gray-950/80 bg-white/60 dark:text-sky-300 text-fuchsia-900 font-bold rounded-r-3xl px-4 py-2 transition sm:hover:opacity-80 active:opacity-80"
                >
                    Send
                </button>
            </div>

        </div>
    )
}

export default ChatBox;