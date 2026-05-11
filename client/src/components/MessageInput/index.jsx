import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMessageStore } from '../../store/messageSlice';
import { useAuthStore } from '../../store/authSlice';
import { socket } from '../../hooks/useSocket';
import { api } from "../../api";

export default function MessageInput({ channelId, replyTo, clearReply }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const typingTimerRef = useRef(null);
  const selectedFileUrl = useMemo(() => {
    if (!file || voiceUrl || !file.type?.startsWith("image/")) return null;
    return URL.createObjectURL(file);
  }, [file, voiceUrl]);

  const sendMessage = useMessageStore(s => s.sendMessage);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      stopTyping();
      if (voiceUrl) {
        URL.revokeObjectURL(voiceUrl);
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [voiceUrl, channelId, user?.username]);

  useEffect(() => {
    return () => {
      if (selectedFileUrl) {
        URL.revokeObjectURL(selectedFileUrl);
      }
    };
  }, [selectedFileUrl]);

  const clearVoiceNote = () => {
    if (voiceUrl) {
      URL.revokeObjectURL(voiceUrl);
    }
    setVoiceUrl(null);
    setFile(null);
  };

  const clearSelectedFile = () => {
    setFile(null);
  };

  const formatFileSize = (size = 0) => {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stopTyping = () => {
    if (!channelId || !user?.username) return;
    socket.emit("typing:stop", {
      channelId,
      username: user.username
    });
  };

  const handleContentChange = (event) => {
    const nextContent = event.target.value;
    setContent(nextContent);

    if (!channelId || !user?.username) return;

    if (nextContent.trim()) {
      socket.emit("typing:start", {
        channelId,
        username: user.username
      });

      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(stopTyping, 1200);
    } else {
      clearTimeout(typingTimerRef.current);
      stopTyping();
    }
  };

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecordingError("Voice recording is not supported in this browser");
      return;
    }

    try {
      clearVoiceNote();
      setRecordingError("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
          type: audioBlob.type
        });

        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        setFile(audioFile);
        setVoiceUrl(URL.createObjectURL(audioBlob));
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setRecordingError("Microphone permission is required");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  function cancelRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    clearVoiceNote();
  }

  async function send(e) {
    e.preventDefault();

    if (!channelId) return;
    if (!content.trim() && !file) return;

    let fileUrl = null;
    let fileType = null;

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post("/messages/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });

        fileUrl = res.data.fileUrl;
        fileType = res.data.fileType;
      }

      await sendMessage(
        channelId,
        content,
        replyTo?._id,
        fileUrl,
        fileType
      );

      setContent('');
      stopTyping();
      clearTimeout(typingTimerRef.current);
      clearVoiceNote();
      clearReply();
    } catch (err) {
      console.log("SEND ERROR:", err.response?.data || err.message);
      alert("Failed to send message");
    }
  }

  return (
    <div className="input-container">
      {replyTo && (
        <div className="reply-preview-bar">
          <span className="reply-text">
            Replying to: {replyTo.content || "Attachment"}
          </span>
          <button className="reply-close" onClick={clearReply}>x</button>
        </div>
      )}

      {recordingError && (
        <div className="voice-error">{recordingError}</div>
      )}

      {(isRecording || voiceUrl) && (
        <div className="voice-preview-bar">
          {isRecording ? (
            <span className="recording-indicator">Recording...</span>
          ) : (
            <audio src={voiceUrl} controls />
          )}

          <button type="button" className="voice-cancel" onClick={cancelRecording}>
            Cancel
          </button>
        </div>
      )}

      {file && !voiceUrl && !isRecording && (
        <div className="selected-file-preview">
          <div className="selected-file-thumb">
            {selectedFileUrl ? (
              <img src={selectedFileUrl} alt={file.name} />
            ) : (
              <span>File</span>
            )}
          </div>
          <div className="selected-file-details">
            <span className="selected-file-label">Selected file</span>
            <strong>{file.name}</strong>
            <span>{formatFileSize(file.size)}</span>
          </div>
          <button type="button" className="selected-file-remove" onClick={clearSelectedFile}>
            Remove
          </button>
        </div>
      )}

      <form className="input-row" onSubmit={send}>
        <input
          className="chat-input"
          value={content}
          onChange={handleContentChange}
          placeholder="Type a message..."
        />

        <label className="file-btn" title="Attach file">
          File
          <input
            type="file"
            hidden
            onChange={(e) => {
              clearVoiceNote();
              setFile(e.target.files?.[0] || null);
            }}
          />
        </label>

        <button
          type="button"
          className={isRecording ? "voice-btn recording" : "voice-btn"}
          onClick={isRecording ? stopRecording : startRecording}
          title={isRecording ? "Stop recording" : "Record voice message"}
        >
          {isRecording ? "Stop" : "Voice"}
        </button>

        <button type="submit" className="send-btn" disabled={isRecording}>
          Send
        </button>
      </form>
    </div>
  );
}
