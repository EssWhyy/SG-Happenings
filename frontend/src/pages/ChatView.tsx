import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, TextField, Button, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import PersonOutlineIcon from '@mui/icons-material/Person';
import { supabase } from '../services/supabaseClient';
import type { Listing } from '../../../shared/apiContract';

interface ChatViewProps {
  listing: Listing;
  currentUserId: string; // cognito
  currentUserEmail: string;
  onBack: () => void;
}

interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export default function ChatView({ listing, currentUserId, currentUserEmail, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recipientId = listing.authorId;
  const recipientName = listing.contact || recipientId;

  // 1. Fetch initial message history & Subscribe to Realtime changes
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    // Setup Supabase Realtime Channel
    const channel = supabase
      .channel(`chat_${listing.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listing.id}`,
        },
        (payload: any) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Prevent duplicate entries if optimistic update already added it
            if (prev.some((msg) => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listing.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const contentToSend = inputText.trim();
    setInputText('');

    const { error } = await supabase.from('messages').insert([
      {
        listing_id: listing.id,
        sender_id: currentUserId,
        receiver_id: recipientId,
        content: contentToSend,
      },
    ]);

    if (error) {
      console.error('Error sending message:', error.message);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default' }}>
      
      {/* Telegram-style Top Profile Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid', borderColor: 'divider', gap: 2, backgroundColor: 'background.paper' }}>
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PersonOutlineIcon />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {recipientName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Re: {listing.title}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages Scroll Area */}
      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <Paper elevation={0} sx={{ p: 1.5, maxWidth: '75%', borderRadius: 2, bgcolor: isMe ? 'primary.main' : 'background.paper', color: isMe ? 'primary.contrastText' : 'text.primary', border: isMe ? 'none' : '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, fontSize: '0.65rem', opacity: 0.7 }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Paper>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Bar (File / Image upload disabled) */}
      <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, backgroundColor: 'background.paper' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Write a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
        />
        <Button type="submit" variant="contained" sx={{ minWidth: 'auto', borderRadius: '50%', p: 1.2 }}>
          <SendIcon fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
}