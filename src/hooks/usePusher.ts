import { useEffect } from 'react';
import { pusher } from '../lib/api';

type EventCallback = (data: any) => void;

export function usePusher(channelName: string, events: { [key: string]: EventCallback }) {
  useEffect(() => {
    if (!pusher) {
      console.warn('Pusher is not configured. Real-time updates will not work.');
      return;
    }

    const channel = pusher.subscribe(channelName);

    // Bind all events
    Object.entries(events).forEach(([event, callback]) => {
      channel.bind(event, callback);
    });

    // Cleanup
    return () => {
      Object.keys(events).forEach(event => {
        channel.unbind(event);
      });
      pusher.unsubscribe(channelName);
    };
  }, [channelName, events]);
} 