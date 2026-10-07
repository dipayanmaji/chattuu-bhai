import React, { useState } from "react";
import { MdClose, MdLogout } from "react-icons/md";
import { DEFAULT_ROOM } from "../../utilities/config";

const Badge = ({ n }) => n > 0 ? <span className="ml-auto text-xs px-1.5 rounded-full bg-fuchsia-600 dark:bg-sky-500 text-white">{n > 99 ? '99+' : n}</span> : null;

const rowClass = (active) =>
    `group/row w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left text-sm cursor-pointer ${active ? 'dark:bg-sky-300/20 bg-white/40' : 'hover:bg-white/20 dark:hover:bg-white/10'}`;

const Sidebar = ({ channels, dms, online, unread, activeRoom, userId, username, onOpenRoom, onJoinChannel, onLeaveChannel, onOpenDM, onCloseDM, onChangeName, onClose }) => {
    const [newRoom, setNewRoom] = useState('');

    const submitRoom = (e) => {
        e.preventDefault();
        if (!newRoom.trim()) return;
        onJoinChannel(newRoom);
        setNewRoom('');
    };

    return (
        <aside className="w-full h-full flex flex-col gap-3 p-3 overflow-y-auto text-white">
            <div className="flex items-center justify-between md:hidden">
                <span className="font-semibold">Menu</span>
                <button onClick={onClose} className="text-xl"><MdClose /></button>
            </div>

            <section>
                <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Rooms</h3>
                {channels.map((room) =>
                    <div key={room} className={rowClass(activeRoom === room)} onClick={() => onOpenRoom(room)}>
                        <span className="truncate"># {room}</span>
                        <Badge n={unread[room]} />
                        {room !== DEFAULT_ROOM &&
                            <button
                                title="Leave room"
                                onClick={(e) => { e.stopPropagation(); onLeaveChannel(room); }}
                                className={`${unread[room] ? '' : 'ml-auto'} opacity-60 hover:opacity-100`}
                            ><MdClose /></button>
                        }
                    </div>
                )}
                <form onSubmit={submitRoom} className="mt-1 flex gap-1">
                    <input
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        maxLength={24}
                        placeholder="Create / join room"
                        className="min-w-0 flex-1 px-2 py-1 text-sm rounded-lg bg-white/20 placeholder-white/60 outline-none"
                    />
                    <button className="px-2 text-sm rounded-lg bg-white/20 hover:bg-white/30">Go</button>
                </form>
            </section>

            {Object.keys(dms).length > 0 &&
                <section>
                    <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Direct messages</h3>
                    {Object.entries(dms).map(([key, name]) =>
                        <div key={key} className={rowClass(activeRoom === key)} onClick={() => onOpenRoom(key)}>
                            <span className="truncate">@ {name}</span>
                            <Badge n={unread[key]} />
                            <button
                                title="Close conversation"
                                onClick={(e) => { e.stopPropagation(); onCloseDM(key); }}
                                className={`${unread[key] ? '' : 'ml-auto'} opacity-60 hover:opacity-100`}
                            ><MdClose /></button>
                        </div>
                    )}
                </section>
            }

            <section className="flex-1">
                <h3 className="text-xs uppercase tracking-wide opacity-70 mb-1">Online ({online.length})</h3>
                {online.map((u) =>
                    <button
                        key={u.userId}
                        disabled={u.userId === userId}
                        onClick={() => onOpenDM(u)}
                        className={`${rowClass(false)} disabled:cursor-default`}
                        title={u.userId === userId ? 'This is you' : `Message ${u.username} privately`}
                    >
                        <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                        <span className="truncate">{u.username}{u.userId === userId && ' (you)'}</span>
                    </button>
                )}
            </section>

            <button onClick={onChangeName} className="flex items-center gap-2 px-2 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20">
                <MdLogout /> Change name ({username})
            </button>
        </aside>
    );
};

export default Sidebar;
