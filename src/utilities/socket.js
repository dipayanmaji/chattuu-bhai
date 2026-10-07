import io from 'socket.io-client';
import { SERVER_URL } from './config';

// single shared connection for the whole app
const socket = io(SERVER_URL, { autoConnect: true });

export default socket;
