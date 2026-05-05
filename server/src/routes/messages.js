import { Router } from "express";
import { getMessages, sendMessage, addReaction, editMessage, deleteMessage } from "../controllers/messages.js";
import { upload } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// 🔥 PUT THIS FIRST
router.post("/upload", upload.single("file"), (req, res) => {
  console.log("FILE:", req.file);

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileUrl = `${process.env.API_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;

  res.json({
    fileUrl,
    fileType: req.file.mimetype
  });
});

//
router.get("/:channelId", getMessages);
router.post("/:channelId", sendMessage);
router.put("/:channelId/:messageId", editMessage);
router.delete("/:channelId/:messageId", deleteMessage);
router.post("/:channelId/:messageId/reactions", addReaction);

export default router;
