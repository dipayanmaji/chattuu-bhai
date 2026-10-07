import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import socket from '../utilities/socket';
import { SERVER_URL, DEFAULT_ROOM } from '../utilities/config';
import { load, save } from '../utilities/storage';
import sendTone from '../utilities/tones/send-tone.mp3';
import receiveTone from '../utilities/tones/receive-tone.mp3';

export const isDM = (room) => room.startsWith('dm:');
export const dmKey = (a, b) => 'dm:' + [a, b].sort().join(':');
export const dmOther = (key, me) => key.split(':').slice(1).find((id) => id !== me);
export const normalizeRoom = (name) =>
    name.trim().toLowerCase().replace(/[^a-z0-9_\s-]/g, '').replace(/\s+/g, '-').slice(0, 24);

const sendAudio = new Audio(sendTone);
const receiveAudio = new Audio(receiveTone);
const play = (audio) => {
    audio.currentTime = 0;
    audio.play().catch(() => { /* autoplay blocked, ignore */ });
};

// merge lists of messages, dedupe by id and keep chronological order
const merge = (a, b) => {
    const map = new Map();
    [...a, ...b].forEach((m) => map.set(m.id, m));
    return [...map.values()].sort((x, y) => new Date(x.createdAt) - new Date(y.createdAt));
};

const fetchHistory = async (room, before) => {
    const { data } = await axios.get(`${SERVER_URL}/api/getmessages`, { params: { room, before } });
    return data;
};

// a deleted message must not stay readable inside replies that quote it
const scrubReplies = (list, deletedId) =>
    list.map((m) => (m.replyTo && m.replyTo.id === deletedId ? { ...m, replyTo: { ...m.replyTo, text: 'Message deleted' } } : m));

const useChat = ({ secret, username, onJoinError }) => {
    const [connected, setConnected] = useState(socket.connected);
    const [userId, setUserId] = useState(() => load('chattuu_pid', '')); // public id, confirmed by the server
    const [channels, setChannels] = useState(() => load('chattuu_channels', [DEFAULT_ROOM]));
    const [dms, setDms] = useState(() => load('chattuu_dms', {})); // roomKey -> other user's name
    const [activeRoom, setActiveRoom] = useState(DEFAULT_ROOM);
    const [messages, setMessages] = useState({});
    const [hasMore, setHasMore] = useState({});
    const [unread, setUnread] = useState({});
    const [online, setOnline] = useState([]);
    const [typing, setTyping] = useState({}); // room -> { userId: username }
    const [muted, setMuted] = useState(() => load('chattuu_muted', false));
    const [error, setError] = useState('');
    const [loadingRoom, setLoadingRoom] = useState(false);
    const [hiddenCount, setHiddenCount] = useState(0);

    const activeRef = useRef(activeRoom);
    const mutedRef = useRef(muted);
    const userIdRef = useRef(userId);
    const channelsRef = useRef(channels);
    const onlineRef = useRef(online);
    const onJoinErrorRef = useRef(onJoinError);
    const loadedRef = useRef(new Set());
    const typingTimers = useRef({});
    activeRef.current = activeRoom;
    mutedRef.current = muted;
    userIdRef.current = userId;
    channelsRef.current = channels;
    onlineRef.current = online;
    onJoinErrorRef.current = onJoinError;

    useEffect(() => save('chattuu_channels', channels), [channels]);
    useEffect(() => save('chattuu_dms', dms), [dms]);
    useEffect(() => save('chattuu_muted', muted), [muted]);

    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setError(''), 4000);
        return () => clearTimeout(t);
    }, [error]);

    // ---- messages state helpers
    const addMessage = useCallback((room, msg) => {
        setMessages((prev) => {
            const list = prev[room] || [];
            if (msg.id && list.some((m) => m.id === msg.id)) return prev;
            return { ...prev, [room]: [...list, msg] };
        });
    }, []);

    const loadRoom = useCallback(async (room) => {
        if (loadedRef.current.has(room)) return;
        loadedRef.current.add(room);
        if (isDM(room)) return; // private messages are not stored on the server
        setLoadingRoom(true);
        try {
            const res = await fetchHistory(room);
            setMessages((prev) => ({ ...prev, [room]: merge(res.data, prev[room] || []) }));
            setHasMore((prev) => ({ ...prev, [room]: res.hasMore }));
        } catch (e) {
            loadedRef.current.delete(room);
            setError('Could not load previous messages');
        } finally {
            setLoadingRoom(false);
        }
    }, []);

    const loadOlder = useCallback(async () => {
        const room = activeRef.current;
        const first = (messages[room] || []).find((m) => !m.system);
        if (!first) return;
        setLoadingRoom(true);
        try {
            const res = await fetchHistory(room, first.id);
            setMessages((prev) => ({ ...prev, [room]: merge(res.data, prev[room] || []) }));
            setHasMore((prev) => ({ ...prev, [room]: res.hasMore }));
        } catch (e) {
            setError('Could not load older messages');
        } finally {
            setLoadingRoom(false);
        }
    }, [messages]);

    // ---- socket events
    useEffect(() => {
        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);

        const onReceive = (msg) => {
            const mine = msg.userId === userIdRef.current;
            if (isDM(msg.room)) {
                // also lists conversations started from another tab / device
                const name = mine
                    ? (onlineRef.current.find((u) => u.userId === dmOther(msg.room, userIdRef.current)) || {}).username || 'Someone'
                    : msg.username;
                setDms((prev) => (mine && prev[msg.room]) || prev[msg.room] === name ? prev : { ...prev, [msg.room]: name });
            }
            addMessage(msg.room, msg);

            if (mine) {
                if (!mutedRef.current) play(sendAudio);
                return;
            }

            if (msg.room !== activeRef.current) setUnread((prev) => ({ ...prev, [msg.room]: (prev[msg.room] || 0) + 1 }));
            if (document.hidden) {
                setHiddenCount((n) => n + 1);
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(isDM(msg.room) ? msg.username : `${msg.username} in #${msg.room}`, {
                        body: msg.message || '📷 Photo',
                        tag: msg.room
                    });
                }
            }
            if (!mutedRef.current) play(receiveAudio);

            // sender obviously stopped typing
            setTyping((prev) => {
                if (!prev[msg.room] || !prev[msg.room][msg.userId]) return prev;
                const { [msg.userId]: _, ...rest } = prev[msg.room];
                return { ...prev, [msg.room]: rest };
            });
        };

        const onUpdate = (msg) => {
            setMessages((prev) => {
                const list = prev[msg.room];
                if (!list) return prev;
                const updated = list.map((m) => (m.id === msg.id ? msg : m));
                return { ...prev, [msg.room]: msg.deleted ? scrubReplies(updated, msg.id) : updated };
            });
        };

        const onSystem = ({ room, text, createdAt }) => {
            addMessage(room, { id: `sys-${Date.now()}-${Math.random()}`, system: true, message: text, createdAt });
        };

        const onTyping = ({ room, userId: uid, username: name, isTyping }) => {
            const key = `${room}:${uid}`;
            clearTimeout(typingTimers.current[key]);
            const clear = () => setTyping((prev) => {
                if (!prev[room] || !prev[room][uid]) return prev;
                const { [uid]: _, ...rest } = prev[room];
                return { ...prev, [room]: rest };
            });
            if (isTyping) {
                setTyping((prev) => ({ ...prev, [room]: { ...(prev[room] || {}), [uid]: name } }));
                typingTimers.current[key] = setTimeout(clear, 4000);
            } else clear();
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        // the socket may have connected before these listeners were attached
        setConnected(socket.connected);
        socket.on('online_users', setOnline);
        socket.on('receive_message', onReceive);
        socket.on('message_updated', onUpdate);
        socket.on('system_message', onSystem);
        socket.on('typing', onTyping);
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('online_users', setOnline);
            socket.off('receive_message', onReceive);
            socket.off('message_updated', onUpdate);
            socket.off('system_message', onSystem);
            socket.off('typing', onTyping);
        };
    }, [addMessage]);

    // register on (re)connect or when the nickname changes, then rejoin rooms
    useEffect(() => {
        if (!connected || !username) return;
        socket.emit('join', { secret, username }, (res) => {
            if (!res || res.error) {
                setError((res && res.error) || 'Could not join the chat');
                if (onJoinErrorRef.current) onJoinErrorRef.current(res || {});
                return;
            }
            setUserId(res.userId);
            save('chattuu_pid', res.userId);
            userIdRef.current = res.userId;

            channelsRef.current.forEach((room) => socket.emit('join_room', { room, silent: true }));

            // rooms already on screen: pick up whatever was missed while offline
            const known = [...loadedRef.current].filter((room) => !isDM(room));
            known.forEach((room) => {
                fetchHistory(room).then((h) =>
                    setMessages((prev) => ({ ...prev, [room]: merge(prev[room] || [], h.data) }))
                ).catch(() => { });
            });
            if (!loadedRef.current.has(activeRef.current)) loadRoom(activeRef.current);
        });
    }, [connected, username, secret, loadRoom]);

    // ask for notification permission on the first interaction (needs a user gesture in some browsers)
    useEffect(() => {
        if (!username || !('Notification' in window) || Notification.permission !== 'default') return;
        const ask = () => Notification.requestPermission();
        window.addEventListener('pointerdown', ask, { once: true });
        return () => window.removeEventListener('pointerdown', ask);
    }, [username]);

    // tab title badge + reset when the user comes back
    useEffect(() => {
        const onVisible = () => { if (!document.hidden) setHiddenCount(0); };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, []);
    useEffect(() => {
        document.title = hiddenCount > 0 ? `(${hiddenCount}) Chattuu Bhai` : 'Chattuu Bhai';
    }, [hiddenCount]);

    // ---- actions
    const emit = useCallback((event, payload) => new Promise((resolve) => {
        if (!socket.connected) {
            setError('You are offline. Reconnecting…');
            return resolve(false);
        }
        socket.emit(event, payload, (res) => {
            if (res && res.error) {
                setError(res.error);
                return resolve(false);
            }
            resolve(true);
        });
    }), []);

    const sendMessage = useCallback(({ text, image, replyTo }) =>
        emit('send_message', { room: activeRef.current, message: text, image, replyTo: replyTo && replyTo.id }), [emit]);
    const editMessage = useCallback((id, text) => emit('edit_message', { id, message: text }), [emit]);
    const deleteMessage = useCallback((id) => emit('delete_message', { id }), [emit]);
    const react = useCallback((id, emoji) => emit('react', { id, emoji }), [emit]);
    // `room` is passed explicitly so "stopped typing" reaches the room you were typing in, even after switching
    const setTypingState = useCallback((isTyping, room) => {
        if (socket.connected) socket.emit('typing', { room: room || activeRef.current, isTyping });
    }, []);

    const openRoom = useCallback((room) => {
        setActiveRoom(room);
        setUnread((prev) => (prev[room] ? { ...prev, [room]: 0 } : prev));
        loadRoom(room);
    }, [loadRoom]);

    const joinChannel = useCallback(async (name) => {
        const room = normalizeRoom(name);
        if (!room) return setError('Room names can use letters, numbers, - and _');
        if (!channelsRef.current.includes(room)) {
            // the server may refuse (e.g. too many rooms), so only add it once it accepted
            if (!(await emit('join_room', { room }))) return;
            setChannels((prev) => (prev.includes(room) ? prev : [...prev, room]));
        }
        openRoom(room);
    }, [openRoom, emit]);

    const leaveChannel = useCallback((room) => {
        if (room === DEFAULT_ROOM) return;
        socket.emit('leave_room', { room });
        setChannels((prev) => prev.filter((r) => r !== room));
        if (activeRef.current === room) openRoom(DEFAULT_ROOM);
    }, [openRoom]);

    const openDM = useCallback((user) => {
        if (!userIdRef.current || user.userId === userIdRef.current) return;
        const key = dmKey(userIdRef.current, user.userId);
        setDms((prev) => (prev[key] === user.username ? prev : { ...prev, [key]: user.username }));
        openRoom(key);
    }, [openRoom]);

    const closeDM = useCallback((key) => {
        setDms((prev) => {
            const { [key]: _, ...rest } = prev;
            return rest;
        });
        if (activeRef.current === key) openRoom(DEFAULT_ROOM);
    }, [openRoom]);

    return {
        connected, userId, channels, dms, activeRoom, messages, hasMore, unread, online, typing, muted, error, loadingRoom,
        setMuted, setError, sendMessage, editMessage, deleteMessage, react, setTypingState,
        openRoom, joinChannel, leaveChannel, openDM, closeDM, loadOlder
    };
};

export default useChat;
