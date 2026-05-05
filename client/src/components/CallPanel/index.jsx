import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authSlice';

const peerConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export default function CallPanel({ channelId }) {
  const { user } = useAuthStore();
  const [incomingCall, setIncomingCall] = useState(null);
  const [status, setStatus] = useState('idle');
  const [callType, setCallType] = useState('audio');
  const [remotePeerId, setRemotePeerId] = useState(null);
  const [error, setError] = useState('');

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const attachLocalStream = (stream) => {
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const attachRemoteStream = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  };

  const stopLocalStream = () => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
  };

  const resetCall = ({ preserveError = false } = {}) => {
    peerRef.current?.close();
    peerRef.current = null;
    stopLocalStream();
    remoteStreamRef.current = new MediaStream();
    setIncomingCall(null);
    setStatus('idle');
    setRemotePeerId(null);
    if (!preserveError) {
      setError('');
    }
  };

  const getMedia = async (type) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Calling is not supported in this browser');
    }

    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video'
    });
  };

  const createPeer = (peerId) => {
    const peer = new RTCPeerConnection(peerConfig);
    peerRef.current = peer;

    localStreamRef.current?.getTracks().forEach(track => {
      peer.addTrack(track, localStreamRef.current);
    });

    peer.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStreamRef.current.addTrack(track);
      });
      attachRemoteStream();
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('call:ice-candidate', {
          to: peerId,
          candidate: event.candidate
        });
      }
    };

    peer.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(peer.connectionState)) {
        resetCall();
      }
    };

    return peer;
  };

  const startCall = async (type) => {
    if (!channelId || status !== 'idle') return;

    try {
      setError('');
      setCallType(type);
      const stream = await getMedia(type);
      attachLocalStream(stream);
      setStatus('calling');

      socket.emit('call:request', {
        channelId,
        type,
        caller: user?.username || 'Someone'
      });
    } catch (err) {
      setError(err.message || 'Could not start call');
      resetCall({ preserveError: true });
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      setError('');
      setCallType(incomingCall.type);
      const stream = await getMedia(incomingCall.type);
      attachLocalStream(stream);
      setRemotePeerId(incomingCall.from);
      setStatus('active');

      socket.emit('call:accept', {
        to: incomingCall.from,
        channelId
      });
      setIncomingCall(null);
    } catch (err) {
      setError(err.message || 'Could not accept call');
      socket.emit('call:reject', { to: incomingCall.from });
      resetCall({ preserveError: true });
    }
  };

  const rejectCall = () => {
    if (incomingCall?.from) {
      socket.emit('call:reject', { to: incomingCall.from });
    }
    setIncomingCall(null);
  };

  const endCall = () => {
    if (remotePeerId) {
      socket.emit('call:end', { to: remotePeerId });
    }
    resetCall();
  };

  useEffect(() => {
    const handleIncoming = (call) => {
      if (call.channelId !== channelId || status !== 'idle') return;
      setIncomingCall(call);
      setCallType(call.type);
    };

    const handleAccepted = async ({ from }) => {
      if (status !== 'calling') return;

      setRemotePeerId(from);
      setStatus('active');
      const peer = createPeer(from);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit('call:offer', { to: from, offer });
    };

    const handleOffer = async ({ from, offer }) => {
      setRemotePeerId(from);
      const peer = createPeer(from);
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('call:answer', { to: from, answer });
      setStatus('active');
    };

    const handleAnswer = async ({ answer }) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!peerRef.current || !candidate) return;
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleCallEnd = () => {
      resetCall();
    };

    const handleRejected = () => {
      resetCall();
      setError('Call declined');
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:ended', handleCallEnd);
    socket.on('call:rejected', handleRejected);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:ended', handleCallEnd);
      socket.off('call:rejected', handleRejected);
    };
  }, [channelId, incomingCall, status]);

  useEffect(() => {
    attachLocalStream(localStreamRef.current);
    attachRemoteStream();
  });

  useEffect(() => resetCall, [channelId]);

  return (
    <div className="call-panel">
      <div className="call-actions">
        <button disabled={!channelId || status !== 'idle'} onClick={() => startCall('audio')}>
          Audio Call
        </button>
        <button disabled={!channelId || status !== 'idle'} onClick={() => startCall('video')}>
          Video Call
        </button>
        {status !== 'idle' && (
          <button className="end-call-btn" onClick={endCall}>
            End
          </button>
        )}
      </div>

      {incomingCall && (
        <div className="incoming-call">
          <span>{incomingCall.caller} is calling</span>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={rejectCall}>Decline</button>
        </div>
      )}

      {status !== 'idle' && (
        <div className={callType === 'video' ? 'call-stage video' : 'call-stage audio'}>
          <div className="call-status">
            {status === 'calling' ? 'Calling...' : `${callType} call active`}
          </div>
          <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
          <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
        </div>
      )}

      {error && <div className="call-error">{error}</div>}
    </div>
  );
}
