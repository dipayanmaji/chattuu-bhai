import React, { useRef, useState } from "react";

// const messages = [
//     {
//         text: "hii this is chattuu bhai",
//         time: "01:03 PM"
//     },
//     {
//         text: "hii Whatsupp",
//         time: "11:10 PM"
//     },
//     {
//         text: "Hello Brother",
//         time: "11:03 PM"
//     },
//     {
//         text: "hii this is chattuu bhai",
//         time: "01:03 PM"
//     },
//     {
//         text: "hii how are you",
//         time: "10:33 PM"
//     },
//     {
//         text: "hii Whatsupp",
//         time: "11:10 PM"
//     },
//     {
//         text: "heyy chattuu bhai here",
//         time: "05:03 PM"
//     },
//     {
//         text: "when you go to bed chattuu bhai!",
//         time: "03:30 PM"
//     },
//     {
//         text: "hii this is chattuu bhai",
//         time: "01:03 PM"
//     },
// ]

const ChatBox = () => {
    const [messages, setMessages] = useState([
        {
            text: "hii this is chattuu bhai",
            time: "01:03 PM"
        },
        {
            text: "hii Whatsupp",
            time: "11:10 PM"
        },
        {
            text: "Hello Brother",
            time: "11:03 PM"
        },
        {
            text: "hii this is chattuu bhai",
            time: "01:03 PM"
        },
        {
            text: "hii how are you",
            time: "10:33 PM"
        },
        {
            text: "hii Whatsupp",
            time: "11:10 PM"
        },
        {
            text: "heyy chattuu bhai here",
            time: "05:03 PM"
        },
        {
            text: "when you go to bed chattuu bhai!",
            time: "03:30 PM"
        },
        {
            text: "hii this is chattuu bhai",
            time: "01:03 PM"
        },
    ]);
    const [newMsg, setNewMsg] = useState('');
    const inputRef = useRef(null);

    const createMessage = () => {
        inputRef.current.focus();
        if (newMsg === '') return;

        const date = new Date();
        let xm = "AM";
        let hh = date.getHours();
        if (hh > 12) {
            hh = hh - 12;
            xm = "PM";
        }
        if (hh < 10) hh = "0" + hh;
        let mm = date.getMinutes();
        if (mm < 10) mm = "0" + mm;

        let time = `${hh}:${mm} ${xm}`

        setMessages([...messages, {
            text: newMsg,
            time: time
        }]);

        setNewMsg('');
    }

    return (
        <div className="w-full max-w-4xl h-[87%] mx-auto dark:bg-neutral-900/50 bg-gray-500/30 rounded-lg relative z-10 overflow-hidden">

            <div className="w-full h-[calc(100%-3.5rem)] px-4 pt-2 mb-2 space-y-2 overflow-auto">
                {
                    messages.map((msg, index) =>
                        <div className="w-full min-h-12 dark:bg-gray-500/10 bg-white/30 dark:text-white text-neutral-800 rounded-xl px-4 pt-2 pb-6">
                            <p>{msg.text}</p>
                            <span className="text-sm float-end inline-block">{msg.time}</span>
                        </div>
                    )
                }
            </div>

            <div className="w-full h-12 min-h-12 px-4 pb-2">
                <input
                    ref={inputRef}
                    onChange={(e) => setNewMsg(e.currentTarget.value)}
                    value={newMsg}
                    autoFocus
                    type="text"
                    placeholder="Message"
                    className="w-[calc(100%-5.5rem)] mr-2 h-full dark:bg-gray-500/10 bg-white/30 dark:text-white text-neutral-800 dark:placeholder-slate-300/80 placeholder-slate-800/80 rounded-full px-4 py-1 outline-none"
                />
                <button
                    onClick={createMessage}
                    className="w-20 h-full dark:bg-gray-500/10 bg-white/30 dark:text-white text-neutral-800 rounded-full px-4 py-1"
                >
                    Send
                </button>
            </div>

        </div>
    )
}

export default ChatBox;