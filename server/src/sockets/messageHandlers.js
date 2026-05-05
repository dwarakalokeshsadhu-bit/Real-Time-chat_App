export function registerMessageHandlers(io, socket) {
  socket.on('channel:join', channelId => socket.join(`channel:${channelId}`));
  socket.on('channel:leave', channelId => socket.leave(`channel:${channelId}`));
  socket.on('dm:join', dmId => socket.join(`dm:${dmId}`));
  socket.on('typing:start', ({ roomId, username }) => socket.to(roomId).emit('typing:indicator', { username, isTyping: true }));
  socket.on('typing:stop', ({ roomId, username }) => socket.to(roomId).emit('typing:indicator', { username, isTyping: false }));
}
