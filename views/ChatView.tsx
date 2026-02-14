import * as React from 'react';
import { AppState, Message, ImageMetadata } from '../types';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { MenuIcon } from '../components/Icons';

interface ChatViewProps {
    appState: AppState;
    theme: 'light' | 'dark';
    addMessage: (message: Message) => void;
    updateMessage: (id: string, text: string) => void;
    regenerateMessage: (id: string) => void;
    isGenerating: boolean;
    triggerAIResponse: (userMessage: Message) => Promise<void>;
    openSidebar: () => void;
    setUserLocation: (location: { latitude: number; longitude: number; } | null) => void;
    userLocation: { latitude: number; longitude: number; } | null;
}

const ChatView: React.FC<ChatViewProps> = ({ appState, addMessage, updateMessage, regenerateMessage, isGenerating, triggerAIResponse, openSidebar, setUserLocation, userLocation }) => {
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [appState.chatHistory, isGenerating]);

    const handleSendMessage = async (text: string, imageFile?: File, textFile?: File) => {
        const isOoc = text.startsWith('(') && text.endsWith(')');
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: text,
            timestamp: new Date().toISOString(),
            ooc: isOoc,
        };

        if (imageFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const imageMetadata: ImageMetadata = {
                    src: reader.result as string,
                    prompt: text,
                    timestamp: new Date().toISOString(),
                    tags: [],
                };
                userMessage.image = imageMetadata;
                addMessage(userMessage);
                triggerAIResponse(userMessage);
            };
            reader.readAsDataURL(imageFile);
        } else if (textFile) {
             const reader = new FileReader();
             reader.onloadend = () => {
                userMessage.file = { name: textFile.name, content: reader.result as string };
                addMessage(userMessage);
                triggerAIResponse(userMessage);
             }
             reader.readAsText(textFile);
        } else {
            addMessage(userMessage);
            await triggerAIResponse(userMessage);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
            <header className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                <div className="flex items-center">
                    <button onClick={openSidebar} className="md:hidden mr-4 text-text-light dark:text-text-dark" aria-label="Open navigation menu">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-text-light dark:text-text-dark">{appState.companionSettings.name}</h1>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {appState.chatHistory.map((msg, index) => {
                    const isRegeneratable =
                        msg.sender === 'ai' &&
                        index > 0 &&
                        appState.chatHistory[index - 1].sender === 'user' &&
                        !appState.chatHistory[index - 1].text.toLowerCase().startsWith('generate a photo:');

                    return (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            onUpdate={updateMessage}
                            onRegenerate={regenerateMessage}
                            isRegeneratable={isRegeneratable}
                            companionImage={appState.companionSettings.referenceImage}
                            ttsConfig={appState.ttsConfig}
                        />
                    );
                })}
                 {isGenerating && (
                    <div className="flex items-center justify-start">
                        <div className="flex items-center space-x-2 bg-card-light dark:bg-card-dark p-3 rounded-lg border border-border-light dark:border-border-dark">
                             <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                             <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                             <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={handleSendMessage} isGenerating={isGenerating} appState={appState} setUserLocation={setUserLocation} userLocationActive={!!userLocation} />
        </div>
    );
};

export default ChatView;