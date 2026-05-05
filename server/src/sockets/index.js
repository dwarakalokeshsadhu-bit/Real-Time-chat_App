import { Server } from "socket.io";

let io;
const onlineUsers = new Map();

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinChannel", (channelId) => {
      socket.join(channelId);
    });

    socket.on("presence:online", (user) => {
      if (!user?.username) return;

      onlineUsers.set(socket.id, {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl || ""
      });

      io.emit("presence:update", Array.from(onlineUsers.values()));
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      onlineUsers.delete(socket.id);
      io.emit("presence:update", Array.from(onlineUsers.values()));
    });
    
    socket.on("leaveChannel", (channelId) => {
  socket.leave(channelId);
});

    socket.on("typing:start", ({ channelId, username }) => {
      if (!channelId || !username) return;
      socket.to(channelId).emit("typing:update", {
        channelId,
        username,
        isTyping: true
      });
    });

    socket.on("typing:stop", ({ channelId, username }) => {
      if (!channelId || !username) return;
      socket.to(channelId).emit("typing:update", {
        channelId,
        username,
        isTyping: false
      });
    });

    socket.on("call:request", ({ channelId, type, caller }) => {
      socket.to(channelId).emit("call:incoming", {
        from: socket.id,
        channelId,
        type,
        caller
      });
    });

    socket.on("call:accept", ({ to, channelId }) => {
      socket.to(to).emit("call:accepted", {
        from: socket.id,
        channelId
      });
    });

    socket.on("call:reject", ({ to }) => {
      socket.to(to).emit("call:rejected", { from: socket.id });
    });

    socket.on("call:offer", ({ to, offer }) => {
      socket.to(to).emit("call:offer", {
        from: socket.id,
        offer
      });
    });

    socket.on("call:answer", ({ to, answer }) => {
      socket.to(to).emit("call:answer", {
        from: socket.id,
        answer
      });
    });

    socket.on("call:ice-candidate", ({ to, candidate }) => {
      socket.to(to).emit("call:ice-candidate", {
        from: socket.id,
        candidate
      });
    });

    socket.on("call:end", ({ to }) => {
      socket.to(to).emit("call:ended", { from: socket.id });
    });
  });

  return io;
}

export function getIO() {
  return io;
}
