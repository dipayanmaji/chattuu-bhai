import React, { useEffect, useRef, useState } from "react";
import { getTime } from "../../utilities/usefullJS";
import { SERVER_URL } from "../../utilities/config";
import axios from 'axios';
import io from 'socket.io-client';
const socket = io.connect("https://chattuu-bhai-server.onrender.com");

const ChatBox = () => {
    let [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    // let [pageNo, setPageNo] = useState(1);
    const inputRef = useRef(null);
    const msgBoxRef = useRef(null);

    // web socket send message connection
    const sendMessage = () => {
        inputRef.current.focus();
        if (newMsg.trim() === '') {
            setNewMsg('');
            return;
        }

        const newMsgObj = {
            message: newMsg,
            date: new Date()
        };

        setMessages((prev) => [...prev, newMsgObj]);
        socket.emit("send_message", newMsgObj);
        setNewMsg('');

        setTimeout(() => {
            msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight);
        }, 10);
    }

    // web socket receive message connection
    useEffect(() => {
        socket.on("receive_message", (data) => {
            setMessages((prev) => [...prev, data]);

            setTimeout(() => {
                msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight);
            }, 10);
        })
    }, [socket]);

    // get messages from server
    // const getMessages = async () => {
    //     try {
    //         const response = await axios.get(SERVER_URL + "/api/getmessages?page=" + pageNo)
    //         console.log(response.data.data);
    //         setMessages(response.data.data);

    //         setNewMsg('');
    //         setTimeout(() => {
    //             console.log('scroll to bottom');
    //             msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight);
    //         }, 10);
    //     }
    //     catch (err) {
    //         console.log(err);
    //     }
    // }

    // update new message to server
    // const createMessage = async () => {
    //     inputRef.current.focus();
    //     if (newMsg.trim() === '') {
    //         setNewMsg('');
    //         return;
    //     }

    //     sendMessage();

    //     try {
    //         const response = await axios.post(SERVER_URL + "/api/postmessage", {
    //             message: newMsg
    //         })
    //         console.log(response.data.data);
    //         getMessages();
    //     }
    //     catch (err) {
    //         console.log(err);
    //         alert('Something went wrong. Please try after some time');
    //         return;
    //     }

    // }

    // useEffect(() => {
    //     getMessages();
    // }, [])

    return (
        <div className="w-full max-w-4xl sm:h-[calc(100%-5rem)] h-[calc(100%-4rem)] mx-auto dark:bg-gray-700/20 bg-gray-500/30 sm:rounded-lg relative z-10 overflow-hidden">

            {/* All messages box */}
            <div
                ref={msgBoxRef}
                className="w-full h-[calc(100%-3.5rem)] px-4 pt-2 mb-2 space-y-2 overflow-y-auto overflow-x-hidden"
            >
                {messages.length > 0 ?

                    messages.map((msg, index) =>
                        <div key={index} id={index} className="w-full min-h-12 dark:bg-gray-900/50 bg-white/30 dark:text-white text-neutral-800 rounded-xl px-4 pt-2 pb-6 border dark:border-white/10 border-transparent">
                            <div className="break-words">{msg.message}</div>
                            <span className="text-sm float-end inline-block">{getTime(msg.date)}</span>
                        </div>
                    )
                    :
                    <div className="w-full h-full grid place-items-center text-center font-medium text-[18px]">Come on, Hit me with you first message.</div>
                }
            </div>

            <div className="w-full h-12 min-h-12 px-4 pb-2 flex items-end">
                <textarea
                    ref={inputRef}
                    onChange={(e) => setNewMsg(e.currentTarget.value)}
                    onKeyUp={(e) => e.key === "Enter" && sendMessage()}
                    value={newMsg}
                    autoFocus
                    type="text"
                    placeholder="Message"
                    className="resize-none break-words w-[calc(100%-5rem)] max-h-24 h-[40px] overflow-y-auto dark:bg-gray-950/80 bg-white/60 dark:text-white text-black dark:placeholder-slate-300/80 placeholder-slate-800/80 rounded-l-3xl px-4 py-[7px] outline-none backdrop-blur-sm border dark:border-white/10 border-transparent"
                ></textarea>

                <button
                    onClick={sendMessage}
                    className="w-20 h-[40px] dark:bg-gray-950/80 bg-white/60 dark:text-sky-300 text-fuchsia-900 font-bold rounded-r-3xl px-4 py-[7px] transition sm:hover:opacity-80 active:opacity-80 backdrop-blur-sm border dark:border-white/10 border-transparent"
                >
                    Send
                </button>
            </div>

        </div>
    )
}

export default ChatBox;