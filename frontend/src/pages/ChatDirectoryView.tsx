import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Stack,
  Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubble from '@mui/icons-material/ChatBubble';
import { supabase } from '../services/supabaseClient';
import type { Listing } from '../../../shared/apiContract';

interface ChatSummary {
  otherUserId: string;
  latestMessage?: string;
  latestTimestamp?: string;
}

interface ChatDirectoryViewProps {
  listing: Listing;
  currentUserId: string;
  onBack: () => void;
  onSelectChat: (recipientId: string) => void;
}

export default function ChatDirectoryView({
  listing,
  currentUserId,
  onBack,
  onSelectChat,
}: ChatDirectoryViewProps) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatPartners = async () => {

      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ChatDirectoryView] Supabase fetch error:', error);
      } else if (data) {
        console.log('[ChatDirectoryView] Raw messages fetched:', data);
        const chatMap = new Map<string, { latestMessage: string; latestTimestamp: string }>();

        data.forEach((msg) => {
          const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
          if (otherId !== currentUserId && !chatMap.has(otherId)) {
            chatMap.set(otherId, {
              latestMessage: msg.content,
              latestTimestamp: msg.created_at,
            });
          }
        });

        const formattedChats: ChatSummary[] = Array.from(chatMap.entries()).map(([otherUserId, info]) => ({
          otherUserId,
          ...info,
        }));

        setChats(formattedChats);
      }
      setLoading(false);
    };

    fetchChatPartners();
  }, [listing.id, currentUserId]);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 480,
        mx: 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        color: '#1e293b',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          gap: 2,
          bgcolor: 'background.paper',
        }}
      >
        <IconButton onClick={onBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            Chats for Listing
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {listing.title}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <Typography variant="body2" sx={{ textAlign: 'center', color: '#64748b', mt: 4 }}>
            Loading conversations...
          </Typography>
        ) : chats.length === 0 ? (
          <Box
            sx={{
              py: 6,
              textAlign: 'center',
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '1px dashed #cbd5e1',
            }}
          >
            <ChatBubble sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No active chats found for this listing yet.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {chats.map((chat) => (
              <Card
                key={chat.otherUserId}
                variant="outlined"
                onClick={() => {
                  onSelectChat(chat.otherUserId);
                }}
                sx={{
                  borderRadius: 2,
                  cursor: 'pointer',
                  borderColor: '#e2e8f0',
                  bgcolor: '#ffffff',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2 } }}>
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'text.primary' }}>
                    {chat.otherUserId.substring(0, 2).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }} noWrap>
                        User: {chat.otherUserId}
                      </Typography>
                      {chat.latestTimestamp && (
                        <Typography variant="caption" sx={{ color: '#94a3b8', flexShrink: 0 }}>
                          {new Date(chat.latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }} noWrap>
                      {chat.latestMessage || 'No messages yet'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}