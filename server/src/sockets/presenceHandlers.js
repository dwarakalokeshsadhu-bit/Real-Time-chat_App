const onlineUsers = new Map();

export function registerPresenceHandlers(io, socket) {
  socket.on('presence:online', user => {
    if (!user?.id) return;
    onlineUsers.set(socket.id, user);
    io.emit('presence:online', user);
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) io.emit('presence:offline', user);
    onlineUsers.delete(socket.id);
  });
}
