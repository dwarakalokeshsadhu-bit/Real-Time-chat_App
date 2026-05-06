import React, { useEffect, useState } from 'react';
import { useChannelStore } from '../../store/channelSlice';
import { useAuthStore } from '../../store/authSlice';
import { useMessageStore } from '../../store/messageSlice';
import { usePresenceStore } from '../../store/presenceSlice';
import { useDMStore } from '../../store/dmSlice';
import DMList from '../DMList';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const {
    channels,
    activeChannel,
    setActiveChannel,
    createChannel,
    updateChannel,
    fetchChannels
  } = useChannelStore();
  const clearActiveDM = useDMStore(s => s.clearActiveDM);
  const activeDM = useDMStore(s => s.activeDM);
  const fetchDMs = useDMStore(s => s.fetchDMs);
  const fetchDMMessages = useDMStore(s => s.fetchDMMessages);

  const { user, logout, uploadAvatar } = useAuthStore();
  const fetchMessages = useMessageStore(s => s.fetchMessages);
  const onlineUsers = usePresenceStore(s => s.onlineUsers);

  const [show, setShow] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [name, setName] = useState("");
  const [membersInput, setMembersInput] = useState(""); // 🔥 NEW

  const activeMembers = activeChannel?.members || [];
  const getMemberName = (member) =>
    typeof member === "string"
      ? member
      : member?.username || member?.email || "Unknown member";
  const onlineNames = new Set(onlineUsers.map(member => member.username));
  const activeMemberCount = activeMembers.filter(member =>
    onlineNames.has(getMemberName(member))
  ).length;
  const disappearingEnabled = Boolean(activeChannel?.disappearingMessagesEnabled);
  const disappearingSeconds = activeChannel?.disappearingMessageSeconds || 86400;
  const avatarInitial = user?.username?.charAt(0)?.toUpperCase() || "U";

  useEffect(() => {
    setShowMembers(false);
  }, [activeChannel?._id]);

  // Handle create group
  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      // 🔥 convert "a,b,c" → ["a","b","c"]
      const members = membersInput
        .split(",")
        .map(m => m.trim())
        .filter(Boolean);

      // 🔥 include creator automatically
      if (user?.username && !members.includes(user.username)) {
        members.push(user.username);
      }

      await createChannel({
        name,
        members,
        type: "private" // 🔥 IMPORTANT
      });

      await fetchChannels();

      setShow(false);
      setName("");
      setMembersInput("");

      toast.success("Group created");

    } catch (err) {
      toast.error(err);
    }
  };

  const handleDisappearingChange = async (updates) => {
    if (!activeChannel?._id) return;

    try {
      await updateChannel(activeChannel._id, {
        disappearingMessagesEnabled: disappearingEnabled,
        disappearingMessageSeconds: disappearingSeconds,
        ...updates
      });
      await fetchMessages(activeChannel._id);
      toast.success("Disappearing messages updated");
    } catch (err) {
      toast.error(err);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    try {
      await uploadAvatar(file);
      if (activeChannel?._id) await fetchMessages(activeChannel._id);
      if (activeDM?._id) await fetchDMMessages(activeDM._id);
      await fetchDMs();
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload profile picture");
    }
  };

  return (
    <aside className="sidebar">
      <h2>Realtime Chat</h2>

      <div className="profile-card">
        <label className="avatar-picker" title="Change profile picture">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username || "Profile"} />
          ) : (
            <span>{avatarInitial}</span>
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </label>
        <div>
          <div className="profile-name">{user?.username}</div>
          <div className="profile-action">Choose profile pic</div>
        </div>
      </div>

      <p className="muted">
        {user?.username} · {user?.role}
        <span style={{ marginLeft: "8px" }}>
          {user?.status === "online" ? "🟢" : "⚪"}
        </span>
      </p>

      <button className="logout" onClick={logout}>
        Logout
      </button>

      <h3>Channels</h3>

      {/* 🔹 Channel List */}
      {channels.map(c => (
        <button
          key={c._id}
          className={
            activeChannel?._id === c._id
              ? 'channel active'
              : 'channel'
          }
          onClick={async () => {
            clearActiveDM();
            setActiveChannel(c);
          }}
        >
          <span># {c.name}</span>
          <span className="channel-count">{c.members?.length || 0}</span>
        </button>
      ))}

      {/* 🔥 Create Channel Button */}
      <DMList />

      <button className="create-btn" onClick={() => setShow(true)}>
        + Create Group
      </button>

      {activeChannel && (
        <button
          className="members-toggle"
          onClick={() => setShowMembers((current) => !current)}
        >
          {showMembers ? "Hide Members" : "Show Members"}
        </button>
      )}

      {showMembers && activeChannel && (
        <div className="members-box">
          <div className="members-title">
            <span>{activeChannel.name} members</span>
            <span>{activeMemberCount} online</span>
          </div>

          {activeMembers.length > 0 ? (
            <ul className="members-list">
              {activeMembers.map((member, index) => (
                <li key={member?._id || getMemberName(member) || index}>
                  <span
                    className={
                      onlineNames.has(getMemberName(member))
                        ? "member-presence online"
                        : "member-presence"
                    }
                  ></span>
                  <span>{getMemberName(member)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="members-empty">No members added yet.</p>
          )}
        </div>
      )}

      {/* 🔥 Create Group Form */}
      {activeChannel && (
        <div className="disappearing-box">
          <label className="disappearing-toggle">
            <input
              type="checkbox"
              checked={disappearingEnabled}
              onChange={(e) =>
                handleDisappearingChange({
                  disappearingMessagesEnabled: e.target.checked
                })
              }
            />
            <span>Disappearing messages</span>
          </label>

          <select
            className="disappearing-select"
            value={disappearingSeconds}
            disabled={!disappearingEnabled}
            onChange={(e) =>
              handleDisappearingChange({
                disappearingMessagesEnabled: true,
                disappearingMessageSeconds: Number(e.target.value)
              })
            }
          >
            <option value={60}>After 1 minute</option>
            <option value={3600}>After 1 hour</option>
            <option value={86400}>After 1 day</option>
            <option value={604800}>After 7 days</option>
          </select>
        </div>
      )}

      {show && (
        <div className="create-channel-box">

          {/* Group Name */}
          <input
            className="channel-input"
            placeholder="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* 🔥 Members input */}
          <input
            className="channel-input"
            placeholder="Add members (comma separated usernames)"
            value={membersInput}
            onChange={(e) => setMembersInput(e.target.value)}
          />

          <div className="create-actions">
            <button onClick={handleCreate}>Create</button>
            <button onClick={() => setShow(false)}>Cancel</button>
          </div>

        </div>
      )}
    </aside>
  );
}
