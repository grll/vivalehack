import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar
} from '@/components/ui/sidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatContext } from '@/contexts/ChatContext';
import { Switch } from '@/components/ui/switch';
import {
    MessageSquare,
    Settings,
    History,
    Moon,
    Sun,
    User,
    MapPin,
    Trash2,
    Loader2,
    X,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/config/api';
import { cn } from '@/lib/utils';

interface Conversation {
    id: string;
    last_message: string;
    last_message_timestamp: string;
    message_count: number;
    last_role: 'user' | 'assistant';
}

interface Message {
    _id: string;
    content: string;
    role: 'user' | 'assistant';
    createdAt: string;
    updatedAt: string;
}

interface ChatResponse {
    conversations: Conversation[];
    total_conversations: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
}

// Beautiful Delete Confirmation Popup
const DeleteConfirmationPopup = ({
    isOpen,
    onClose,
    onConfirm,
    isDeleting
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleModalClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-4 duration-300"
                onClick={handleModalClick}
            >
                {/* Warning Icon */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 rounded-full">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full">
                        <svg
                            className="w-6 h-6 text-red-600 dark:text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {t('sidebar.deleteConversation')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                        {t('sidebar.deleteConversationDescription')}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 text-gray-700 dark:text-gray-300 font-semibold hover:scale-[1.02] active:scale-[0.98] border border-gray-200 dark:border-gray-700"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 text-white font-semibold hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>{t('sidebar.deleting')}</span>
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                                <span>{t('sidebar.deleteForever')}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Additional Safety Info */}
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <svg
                            className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                {t('sidebar.irreversibleAction')}
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                {t('sidebar.confirmDelete')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export function AppSidebar() {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { setSelectedChat, resetChat, navigateToChat, selectedChatId } =
        useChatContext();
    const { setOpenMobile } = useSidebar();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [deletingConversationId, setDeletingConversationId] = useState<
        string | null
    >(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<
        string | null
    >(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchConversations = useCallback(
        async (pageNum: number, reset: boolean = false) => {
            if (isLoading || (!hasMore && !reset)) return;

            setIsLoading(true);
            try {
                const response = await api.get(
                    `/chat?page=${pageNum}&limit=10`
                );

                if (reset) {
                    setConversations(response.data.conversations);
                } else {
                    setConversations((prev) => [
                        ...prev,
                        ...response.data.conversations
                    ]);
                }

                setHasMore(response.data.has_next);
                setPage(pageNum + 1);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, hasMore]
    );

    // Non-blocking refetch function
    const refetchConversations = useCallback(async () => {
        try {
            const response = await api.get('/chat?page=1&limit=10');
            setConversations(response.data.conversations);
            setHasMore(response.data.has_next);
            setPage(2);
        } catch (error) {
            console.error('Error refetching conversations:', error);
        }
    }, []);

    const handleSidebarClick = () => {
        refetchConversations();
    };

    const fetchChatMessages = useCallback(
        async (chatId: string, page: number = 1, limit: number = 20) => {
            try {
                const response = await api.post('/chat/get-chat', {
                    page,
                    limit,
                    id: chatId
                });

                return response.data;
            } catch (error) {
                console.error('Error fetching chat messages:', error);
            }
        },
        []
    );

    const handleConversationClick = async (conversationId: string) => {
        setOpenMobile(false);
        navigateToChat(conversationId);
    };

    const handleNewConversation = () => {
        resetChat();
        setOpenMobile(false); // Close sidebar on mobile
    };

    const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConversationToDelete(conversationId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!conversationToDelete) return;

        setIsDeleting(true);
        setDeletingConversationId(conversationToDelete);

        try {
            await api.delete(`/chat/${conversationToDelete}`);

            // Remove from conversations list
            setConversations((prev) =>
                prev.filter((conv) => conv.id !== conversationToDelete)
            );

            // If this was the selected chat, reset
            if (selectedChatId === conversationToDelete) {
                resetChat();
            }

            setShowDeleteConfirm(false);
            setConversationToDelete(null);
        } catch (error) {
            console.error('Error deleting conversation:', error);
        } finally {
            setIsDeleting(false);
            setDeletingConversationId(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setConversationToDelete(null);
    };

    useEffect(() => {
        fetchConversations(1, true);
    }, []);

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (
                scrollHeight - scrollTop <= clientHeight * 1.5 &&
                hasMore &&
                !isLoading
            ) {
                fetchConversations(page);
            }
        },
        [fetchConversations, page, hasMore, isLoading]
    );

    const formatTimestamp = (dateString: string) => {
        try {
            // Parse the timestamp from the API response
            const date = new Date(dateString);
            const now = new Date();
            
            // Validate that the date is valid
            if (isNaN(date.getTime())) {
                console.error('Invalid date:', dateString);
                return dateString;
            }
            
            // Calculate difference in milliseconds
            const diffInMs = now.getTime() - date.getTime();
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            // Handle edge case where timestamp is in the future (likely wrong year)
            if (diffInMs < 0) {
                // If the date is in the future, it's likely a timestamp issue
                // Try to use the current year instead
                const correctedDate = new Date(date);
                correctedDate.setFullYear(now.getFullYear());
                
                const correctedDiffInMs = now.getTime() - correctedDate.getTime();
                const correctedDiffInMinutes = Math.floor(correctedDiffInMs / (1000 * 60));
                const correctedDiffInHours = Math.floor(correctedDiffInMs / (1000 * 60 * 60));
                
                if (correctedDiffInMs >= 0) {
                    // Use corrected values
                    if (correctedDiffInHours < 1) {
                        return correctedDiffInMinutes <= 1 ? t('time.justNow') : t('time.minutesAgo', { count: correctedDiffInMinutes });
                    } else if (correctedDiffInHours < 24) {
                        return t('time.hoursAgo', { count: correctedDiffInHours });
                    }
                }
                
                // If still in future, just show "just now"
                return t('time.justNow');
            }

            // Normal time calculations
            if (diffInMinutes < 1) {
                return t('time.justNow');
            } else if (diffInHours < 1) {
                return t('time.minutesAgo', { count: diffInMinutes });
            } else if (diffInHours < 24) {
                return t('time.hoursAgo', { count: diffInHours });
            } else if (diffInDays < 7) {
                return t('time.daysAgo', { count: diffInDays });
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            console.error('Error formatting timestamp:', error, dateString);
            return dateString;
        }
    };

    return (
        <>
            <Sidebar
                className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                onClick={handleSidebarClick}
            >
                {/* SidebarHeader commented out for now */}
                {/* <SidebarHeader className="p-3 md:p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-gray-800 rounded-lg flex items-center justify-center shadow-lg">
                            <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-gray-800 text-sm md:text-base tracking-tight">
                                {t('sidebar.appName')}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                                {t('sidebar.appDescription')}
                            </p>
                        </div>
                    </div>
                </SidebarHeader> */}

                <SidebarContent className="px-2">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start gap-3 h-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                            onClick={handleNewConversation}
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            <span className="text-sm">
                                                {t('sidebar.newConversation')}
                                            </span>
                                        </Button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarSeparator />

                    <SidebarGroup>
                        <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2">
                            {t('sidebar.recentConversations')}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <div
                                className="max-h-96 overflow-y-auto"
                                onScroll={handleScroll}
                            >
                                <SidebarMenu className="space-y-1">
                                    {conversations.map((conversation) => (
                                        <SidebarMenuItem key={conversation.id}>
                                            <SidebarMenuButton asChild>
                                                <div
                                                    className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer group h-auto min-h-[50px] md:min-h-[60px]"
                                                    onClick={() =>
                                                        handleConversationClick(
                                                            conversation.id
                                                        )
                                                    }
                                                >
                                                    <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-1 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        {conversation.last_message && (
                                                            <p className="text-xs md:text-sm font-medium text-slate-900 dark:text-white truncate leading-tight">
                                                                {
                                                                    conversation.last_message
                                                                }
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                                            {formatTimestamp(
                                                                conversation.last_message_timestamp
                                                            )}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 flex-shrink-0 ${
                                                            deletingConversationId ===
                                                            conversation.id
                                                                ? 'bg-red-500 hover:bg-red-600 opacity-100'
                                                                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        }`}
                                                        onClick={(e) =>
                                                            handleDeleteClick(
                                                                conversation.id,
                                                                e
                                                            )
                                                        }
                                                    >
                                                        <Trash2
                                                            className={`w-3 h-3 ${
                                                                deletingConversationId ===
                                                                conversation.id
                                                                    ? 'text-white'
                                                                    : 'text-slate-600 dark:text-slate-400'
                                                            }`}
                                                        />
                                                    </Button>
                                                </div>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                    {isLoading && (
                                        <SidebarMenuItem>
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                            </div>
                                        </SidebarMenuItem>
                                    )}
                                </SidebarMenu>
                            </div>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="p-3 md:p-4 space-y-4">
                    <SidebarSeparator />

                    <div className="space-y-3">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <button
                                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 h-10 justify-between"
                                        onClick={toggleTheme}
                                    >
                                        <div className="flex items-center gap-3">
                                            {theme === 'dark' ? (
                                                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                            ) : (
                                                <Sun className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                            )}
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {t('sidebar.darkMode')}
                                            </span>
                                        </div>
                                        <Switch
                                            checked={theme === 'dark'}
                                            onCheckedChange={toggleTheme}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 h-10">
                                        <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {t('sidebar.settings')}
                                        </span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 h-10">
                                        <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            {t('sidebar.history')}
                                        </span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>

                        <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                    {t('sidebar.user')}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('sidebar.freePlan')}
                                </p>
                            </div>
                        </div>
                    </div>
                </SidebarFooter>
            </Sidebar>

            <DeleteConfirmationPopup
                isOpen={showDeleteConfirm}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    );
}
