
import express from 'express';
import { createServer } from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/sockets/index.js';
import { env } from './src/config/env.js';
import cors from 'cors';
  
app.use(cors());

app.use("/uploads", express.static("uploads"));
await connectDB();
const httpServer = createServer(app);
const io = initSocket(httpServer);
app.set('io', io);


httpServer.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
