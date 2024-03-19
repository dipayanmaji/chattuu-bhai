import React, { useEffect, useRef, useState } from "react";
import { getTime } from "../../utilities/usefullJS";
import { IoIosArrowDown } from "react-icons/io";
import sendTone from "../../utilities/tones/send-tone.mp3"
import receiveTone from "../../utilities/tones/receive-tone.mp3"
import reactStringReplace from 'react-string-replace';
import { SERVER_URL } from "../../utilities/config";
import axios from 'axios';
import io from 'socket.io-client';
const socket = io.connect("https://chattuu-bhai-server.onrender.com");

const ChatBox = () => {
    const [userName, setUserName] = useState('');
    const userNameRef = useRef(null);
    const [red, setRed] = useState(false);
    const [allowMessaging, setAllowMessaging] = useState(false);
    let [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [showBtn, setShowBtn] = useState(false);
    // let [pageNo, setPageNo] = useState(1);
    const inputRef = useRef(null);
    const msgBoxRef = useRef(null);

    // userNameBtnHandler
    const userNameBtnHandler = () => {
        if (userName.trim() === '') {
            setUserName('');
            setRed(true);
            userNameRef.current.focus();
            return;
        }

        setUserName(userName.trim());
        setRed(false);
        setAllowMessaging(true);
    }

    // scroll to latest message btn handler
    const scrollBtnHandler = () => {
        const clientHeight = msgBoxRef.current.clientHeight; //display height
        const scrollHeight = msgBoxRef.current.scrollHeight; //total scrollbar hight
        const scrollTop = msgBoxRef.current.scrollTop; //top position

        if (scrollHeight > clientHeight + scrollTop + 200) setShowBtn(true);
        else setShowBtn(false);
    }
    msgBoxRef.current?.addEventListener('scroll', scrollBtnHandler);

    // play tones
    const playTone = (mode) => {
        let audio;
        if (mode === 'send') audio = new Audio(sendTone);
        else audio = new Audio(receiveTone);
        audio.play();
    }

    // web socket send message connection
    const sendMessage = () => {
        inputRef.current.focus();
        if (newMsg.trim() === '') {
            setNewMsg('');
            return;
        }

        const newMsgObj = {
            username: userName.trim(),
            message: newMsg.trim(),
            date: new Date()
        };

        setMessages((prev) => [...prev, newMsgObj]);
        socket.emit("send_message", newMsgObj);
        setNewMsg('');
        playTone("send");

        setTimeout(() => {
            msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight);
        }, 10);
    }

    // web socket receive message connection
    useEffect(() => {
        socket.on("receive_message", (data) => {
            setMessages((prev) => [...prev, data]);
            playTone("receive");

            const clientHeight = msgBoxRef.current.clientHeight; //display height
            const scrollHeight = msgBoxRef.current.scrollHeight; //total scrollbar hight
            const scrollTop = msgBoxRef.current.scrollTop; //top position

            if (scrollHeight <= clientHeight + scrollTop + 200) {
                setTimeout(() => {
                    msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight);
                }, 10);
            }
            else scrollBtnHandler();
        })
    }, [socket]);

    return (
        <div className="w-full max-w-4xl sm:h-[calc(100%-5rem)] h-[calc(100%-4rem)] mx-auto dark:bg-gray-700/20 bg-gray-500/30 sm:rounded-lg relative z-10 overflow-hidden">
            {allowMessaging ?
                <>
                    {/* All messages box */}
                    <div
                        ref={msgBoxRef}
                        className="w-full h-[calc(100%-3.5rem)] px-4 pt-2 mb-2 space-y-2 overflow-y-auto overflow-x-hidden"
                    >
                        {messages.length > 0 ?

                            messages.map((msg, index) =>
                                <div key={index} id={index} className="w-full min-h-12 dark:bg-gray-900/50 bg-white/30 dark:text-white text-neutral-800 rounded-xl px-4 pt-2 pb-6 border dark:border-white/10 border-transparent">
                                    <div className="break-words">
                                        <span className="username">{msg.username === userName ? "You" : msg.username}: </span>
                                        {reactStringReplace(msg.message, 'bhai', (matchMsg, i) => (
                                            <span key={i} className="bhai-text">{matchMsg}</span>
                                        ))}
                                    </div>
                                    <span className="text-sm float-end inline-block">{getTime(msg.date)}</span>
                                </div>
                            )
                            :
                            <div className="w-full h-full grid place-items-center text-center font-medium text-[18px]">Come on {userName}!, Hit me with your first message.</div>
                        }
                    </div>

                    {/* scroll to latest message btn */}
                    <span
                        onClick={() => msgBoxRef.current.scroll(0, msgBoxRef.current.scrollHeight)}
                        className={`absolute right-5 bottom-16 z-20 h-7 w-7 text-[20px] dark:bg-white/30 bg-black/50 rounded-full transition-all duration-500 ${showBtn ? 'opacity-1 visible' : 'opacity-0 invisible'} grid place-items-center cursor-pointer md:hover:opacity-85 transition`}
                    >
                        <IoIosArrowDown />
                    </span>

                    {/* input box and send button */}
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
                </>

                :

                <div className="w-full h-full text-center flex flex-col items-center justify-center gap-4">

                    <div>Hi, I am Chattuu. And your name is
                        <input
                            ref={userNameRef}
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="your nickname"
                            autoFocus
                            className={`break-words bg-transparent w-32 mx-2 px-1 text-white ${red ? 'placeholder-red-300' : 'placeholder-slate-300/60'} outline-none border-b-[1px] border-dotted`}
                        />.
                    </div>

                    <button
                        onClick={userNameBtnHandler}
                        className="block h-[35px] dark:bg-gray-950/80 bg-white/60 dark:text-sky-300 text-fuchsia-900 font-bold rounded-xl px-4 transition sm:hover:opacity-80 active:opacity-80 backdrop-blur-sm border dark:border-white/10 border-transparent"
                    >Start</button>

                </div>
            }

        </div>
    )
}

export default ChatBox;