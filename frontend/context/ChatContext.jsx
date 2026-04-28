import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { getBackendOrigin } from '../services/runtime';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null); // The user we are chatting with

    const appendMessage = useCallback((message) => {
        setMessages((prev) => {
            if (prev.some((item) => item._id === message._id)) {
                return prev;
            }
            return [...prev, message];
        });
    }, []);

    const fetchMessages = useCallback(async (userId) => {
        try {
            const { data } = await api.get(`/chat/${userId}`);
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, []);

    const fetchConversations = useCallback(async () => {
        try {
            const { data } = await api.get('/chat/conversations');
            setConversations(data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, []);

    const sendMessage = useCallback(async ({ receiverId, text = '', imageFile = null, videoFile = null }) => {
        if (!user || !receiverId) {
            return null;
        }

        const formData = new FormData();
        formData.append('receiverId', receiverId);
        if (text.trim()) {
            formData.append('text', text.trim());
        }
        if (imageFile) {
            formData.append('image', imageFile);
        }
        if (videoFile) {
            formData.append('video', videoFile);
        }

        const { data } = await api.post('/chat', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        appendMessage(data);
        fetchConversations();
        return data;
    }, [appendMessage, fetchConversations, user]);

    useEffect(() => {
        if (user) {
            const newSocket = io(getBackendOrigin(), {
                withCredentials: true,
            });
            setSocket(newSocket);

            newSocket.emit('join', user._id);

            newSocket.on('getMessage', (message) => {
                // If the message is from the user we are currently chatting with, add it to the messages
                if (activeChat && (message.sender === activeChat._id || message.receiver === activeChat._id)) {
                    appendMessage(message);
                }
                // Refresh conversations list to show latest message/user
                fetchConversations();
            });

            return () => newSocket.close();
        }
    }, [appendMessage, fetchConversations, user]);

    return (
        <ChatContext.Provider
            value={{
                messages,
                conversations,
                activeChat,
                setActiveChat,
                fetchMessages,
                fetchConversations,
                sendMessage,
                socket,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
