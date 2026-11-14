import { io } from 'socket.io-client';
import api from './api';

// Socket.io is served under the API prefix (<api>/socket.io), so it follows the
// API wherever it is mounted: http://localhost:5000/api in dev, /api behind the
// compose nginx, /mangrove-guard/api behind the k8s ingress.
const apiURL = new URL(api.defaults.baseURL, window.location.origin);

const socket = io(apiURL.origin, {
  path: `${apiURL.pathname.replace(/\/$/, '')}/socket.io`,
  autoConnect: true,
});

export default socket;
