import React, { useEffect, useRef, useState } from "react";
import { getTime } from "../../utilities/usefullJS";
import { SERVER_URL } from "../../utilities/config";
import axios from 'axios';

const ChatBox = () => {
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    let [pageNo, setPageNo] = useState(1);
    const inputRef = useRef(null);
    const msgBoxRef = useRef(null);

    // get messages from server
    const getMessages = async () => {
        try {
            const response = await axios.get(SERVER_URL + "/api/getmessages?page=" + pageNo)
            console.log(response.data.data);
            setMessages(response.data.data);
        }
        catch (err) {
            console.log(err);
        }
    }

    // update new message to server
    const createMessage = async () => {
        inputRef.current.focus();
        if (newMsg.trim() === '') {
            setNewMsg('');
            return;
        }

        try {
            const response = await axios.post(SERVER_URL + "/api/postmessage", {
                message: newMsg
            })
            console.log(response.data.data);
            getMessages();
        }
        catch (err) {
            console.log(err);
            alert('Something went wrong. Please try after some time');
            return;
        }

        setNewMsg('');

        setTimeout(() => {
            msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight);
        }, 1);
    }

    useEffect(() => {
        getMessages();
        msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight);
    }, [])

    return (
        <div className="w-full max-w-4xl sm:h-[calc(100%-5rem)] h-[calc(100%-4rem)] mx-auto dark:bg-gray-700/20 bg-gray-500/30 sm:rounded-lg relative z-10 overflow-hidden">

            {/* All messages box */}
            <div
                ref={msgBoxRef}
                className="w-full h-[calc(100%-3.5rem)] px-4 pt-2 mb-2 space-y-2 overflow-y-auto overflow-x-hidden"
            >
                {
                    messages.map((msg, index) =>
                        <div key={index} id={index} className="w-full min-h-12 dark:bg-gray-900/50 bg-white/30 dark:text-white text-neutral-800 rounded-xl px-4 pt-2 pb-6">
                            <div className="break-words">{msg.message}</div>
                            <span className="text-sm float-end inline-block">{getTime(msg.date)}</span>
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
                    className="resize-none break-words w-[calc(100%-5rem)] max-h-24 h-[40px] overflow-y-auto dark:bg-gray-950/80 bg-white/60 dark:text-white text-black dark:placeholder-slate-300/80 placeholder-slate-800/80 rounded-l-3xl px-4 py-2 outline-none backdrop-blur-sm"
                ></textarea>

                <button
                    onClick={createMessage}
                    className="w-20 h-[40px] dark:bg-gray-950/80 bg-white/60 dark:text-sky-300 text-fuchsia-900 font-bold rounded-r-3xl px-4 py-2 transition sm:hover:opacity-80 active:opacity-80 backdrop-blur-sm"
                >
                    Send
                </button>
            </div>

        </div>
    )
}

export default ChatBox;