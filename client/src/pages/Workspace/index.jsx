import React from "react";
import { useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import ChannelView from '../../components/ChannelView';
import DMView from '../../components/DMView';
import { useChannelStore } from '../../store/channelSlice';
import { useDMStore } from '../../store/dmSlice';
import { useSocket } from '../../hooks/useSocket';

export default function Workspace() {
  const { activeChannel, fetchChannels } = useChannelStore();
  const activeDM = useDMStore(s => s.activeDM);
  useEffect(() => { fetchChannels(); }, []);
  useSocket(activeChannel?._id);
   return (
  <div className="workspace">
    <Sidebar />
    {activeDM ? <DMView /> : <ChannelView channelId={activeChannel?._id} />}
  </div>
);;
}
