import * as React from 'react';
import { SendIcon, PaperclipIcon, MicIcon, ImageIcon, MapPinIcon } from './Icons';
import { AppState } from '../types';

interface SpeechRecognition extends EventTarget { continuous: boolean; interimResults: boolean; lang: string; start(): void; stop(): void; onresult: (event: any) => void; onerror: (event: any) => void; onend: () => void; }
declare global { interface Window { webkitSpeechRecognition: new () => SpeechRecognition; } }

interface ChatInputProps {
    onSend: (text: string, imageFile?: File, textFile?: File) => void;
    isGenerating: boolean;
    appState: AppState;
    setUserLocation: (location: { latitude: number; longitude: number; } | null) => void;
    userLocationActive: boolean;
}

const ImagePromptModal: React.FC<{ onSend: (prompt: string) => void; onClose: () => void; appState: AppState }> = ({ onSend, onClose, appState }) => {
    const [prompt, setPrompt] = React.useState('');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    React.useEffect(() => { textareaRef.current?.focus(); }, []);
    const handleSend = () => { if (prompt.trim()) onSend(prompt.trim()); };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    const { name, appearance, artStyle } = appState.companionSettings;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text-dark">Generate an Image</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 space-y-2">
                    <p>Describe the scene you want {name} to create. The more detail, the better!</p>
                    <p className="text-xs p-2 rounded bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark"><strong>Style:</strong> {artStyle}, <strong>Appearance:</strong> "{appearance}"</p>
                </div>
                <textarea ref={textareaRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown} placeholder="e.g., A photo of us having a picnic in a sunny park." className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={4} />
                <div className="flex justify-end gap-4 mt-4"><button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button><button onClick={handleSend} disabled={!prompt.trim()} className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover disabled:bg-gray-400">Generate</button></div>
            </div>
        </div>
    );
};

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isGenerating, appState, setUserLocation, userLocationActive }) => {
    const [text, setText] = React.useState('');
    const [isListening, setIsListening] = React.useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const recognitionRef = React.useRef<SpeechRecognition | null>(null);

    React.useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.onresult = (event) => {
                let interim = '', final = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) final += event.results[i][0].transcript;
                    else interim += event.results[i][0].transcript;
                }
                if (final) setText(prev => prev + final);
            };
            recognition.onerror = (event) => { console.error('Speech recognition error', event.error); setIsListening(false); };
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
    }, []);

    const handleToggleListening = () => {
        if (isListening) recognitionRef.current?.stop();
        else recognitionRef.current?.start();
        setIsListening(!isListening);
    };

    const handleFile = (file: File) => {
        if (file) {
            onSend(text || `Here's a ${file.type.startsWith('image/') ? 'image' : 'file'}`, file.type.startsWith('image/') ? file : undefined, !file.type.startsWith('image/') ? file : undefined);
            setText('');
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleFile(e.dataTransfer.files[0]); e.dataTransfer.clearData(); } };

    const handleSend = () => { if (text.trim() && !isGenerating) { onSend(text.trim()); setText(''); } };
    const handleImagePromptSend = (prompt: string) => { onSend(`Generate a photo: ${prompt}`); setIsImageModalOpen(false); };
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleLocation = () => {
        if (userLocationActive) {
            setUserLocation(null);
            return;
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    alert(`Error getting location: ${error.message}`);
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const isOocActive = text.trimStart().startsWith('(');

    return (
        <>
            <div className={`p-4 border-t border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark relative`} onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
                {isOocActive && (
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm animate-bounce">
                        OOC Mode: Talking to the system core
                    </div>
                )}
                <div className={`relative flex items-center bg-background-light dark:bg-background-dark rounded-lg p-2 transition-all duration-200 ${isDragging ? 'ring-2 ring-primary' : ''}`}>
                     {isDragging && <div className="absolute inset-0 bg-primary bg-opacity-20 rounded-lg flex items-center justify-center pointer-events-none"><p className="font-bold text-primary">Drop File Here</p></div>}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,text/plain,text/markdown,.md,.txt"/>
                    <button onClick={() => fileInputRef.current?.click()} title="Attach file" className="p-2 text-gray-500 hover:text-primary"><PaperclipIcon className="w-6 h-6" /></button>
                    <button onClick={() => setIsImageModalOpen(true)} title="Generate image" className="p-2 text-gray-500 hover:text-primary"><ImageIcon className="w-6 h-6" /></button>
                    <button onClick={handleLocation} title={userLocationActive ? "Disable location for next message" : "Share location for next message"} className={`p-2 ${userLocationActive ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}><MapPinIcon className="w-6 h-6" /></button>
                    <button onClick={handleToggleListening} title="Voice input" className={`p-2 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-primary'}`}><MicIcon className="w-6 h-6" /></button>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type a message..." className="flex-1 bg-transparent resize-none focus:outline-none mx-2 max-h-24" rows={1} disabled={isGenerating} />
                    <button onClick={handleSend} disabled={isGenerating || !text.trim()} className="p-2 bg-primary text-white rounded-full disabled:bg-gray-400 hover:bg-primary-hover"><SendIcon className="w-6 h-6" /></button>
                </div>
            </div>
            {isImageModalOpen && <ImagePromptModal onSend={handleImagePromptSend} onClose={() => setIsImageModalOpen(false)} appState={appState} />}
        </>
    );
};

export default ChatInput;