import * as React from 'react';
import { Message, TTSConfig } from '../types';
import { EditIcon, RefreshIcon, PlayIcon, GlobeIcon, MapPinIcon, CopyIcon, CheckIcon, FileTextIcon } from './Icons';
import { MOCK_AI_NAME } from '../constants';
import { generateSpeechFromText } from '../services/aiService';

// Fix: Augment the JSX namespace globally to resolve broad intrinsic element type errors.
// This allows the use of standard HTML tags (div, p, button, etc.) and SVG elements 
// which were failing due to missing or restricted type definitions in the environment.
declare global {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
    }
}

// Utilities for decoding and playing raw PCM audio from Gemini API
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*.*?\*)/g).filter(Boolean);
    return (<p className="whitespace-pre-wrap">{parts.map((part, index) => part.startsWith('*') && part.endsWith('*') ? <i key={index}>{part.slice(1, -1)}</i> : part)}</p>);
};

let outputAudioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

interface ChatMessageProps {
    message: Message;
    onUpdate: (id: string, text: string) => void;
    onRegenerate: (id: string) => void;
    isRegeneratable: boolean;
    companionImage: string | null;
    ttsConfig: TTSConfig;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onUpdate, onRegenerate, isRegeneratable, companionImage, ttsConfig }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editText, setEditText] = React.useState(message.text);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isFetchingAudio, setIsFetchingAudio] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const handleUpdate = () => {
        if (editText.trim() !== message.text) onUpdate(message.id, editText.trim());
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpdate(); } 
        else if (e.key === 'Escape') { setIsEditing(false); setEditText(message.text); }
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(message.text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => console.error('Failed to copy text: ', err));
    };

    const handlePlayTTS = async () => {
        if (message.sender !== 'ai' || !ttsConfig.enabled || message.ooc) return;
        if (currentSource) currentSource.stop();

        setIsFetchingAudio(true);
        try {
            if (!outputAudioContext) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                outputAudioContext = new AudioContext({ sampleRate: 24000 });
            }
            const base64Audio = await generateSpeechFromText(message.text.replace(/\*/g, ''), ttsConfig);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.onended = () => { if (currentSource === source) currentSource = null; };
            source.start();
            currentSource = source;
        } catch (error) {
            console.error("Failed to play TTS audio:", error);
            alert(`Could not generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsFetchingAudio(false);
        }
    };

    const isUser = message.sender === 'user';
    let bubbleClasses = isUser ? 'bg-primary text-white rounded-br-none' : 'bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-bl-none';
    if (message.ooc) {
        bubbleClasses = 'bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark border border-border-light dark:border-border-dark';
    }

    return (
        <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            {!isUser && <img src={companionImage || `https://i.pravatar.cc/150?u=${MOCK_AI_NAME}`} alt="Avatar" className="w-10 h-10 rounded-full" />}
            <div className={`max-w-[80%] sm:max-w-md lg:max-w-2xl flex flex-col`}>
                {message.ooc && <div className={`text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>OOC</div>}
                <div className={`p-3 rounded-lg ${bubbleClasses}`}>
                    {isEditing ? (
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleUpdate} className="w-full bg-transparent text-inherit resize-none focus:outline-none" autoFocus />
                    ) : (
                        <>
                            {message.text && (message.ooc ? <p className="whitespace-pre-wrap">{message.text}</p> : <MarkdownRenderer text={message.text} />)}
                        </>
                    )}
                    {message.image && <img src={message.image.src} alt="content" className="mt-2 rounded-lg max-w-xs" />}
                    {message.file && <div className="mt-2 p-2 border rounded-md bg-background-light dark:bg-background-dark flex items-center gap-2"><FileTextIcon className="w-6 h-6 flex-shrink-0" /><div className="overflow-hidden"><p className="font-bold text-sm truncate">{message.file.name}</p><p className="text-xs max-h-24 overflow-y-auto mt-1">{message.file.content.substring(0,200)}...</p></div></div>}
                    {message.modelUrl && <model-viewer src={message.modelUrl} ar ar-modes="webxr scene-viewer quick-look" camera-controls shadow-intensity="1" alt="A 3D model" auto-rotate style={{width: '100%', height: '250px', marginTop: '8px', borderRadius: '8px'}}></model-viewer>}
                    {message.link && (
                        <a href={message.link.url} target="_blank" rel="noopener noreferrer" className="mt-2 block p-2 border rounded-md bg-background-light dark:bg-background-dark hover:bg-gray-200 dark:hover:bg-gray-700">
                            <p className="font-bold text-sm">{message.link.title}</p>
                            <p className="text-xs mt-1">{message.link.description}</p>
                        </a>
                    )}
                    {message.grounding && message.grounding.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-border-light dark:border-border-dark border-opacity-50">
                            <ul className="text-xs space-y-1">
                                {message.grounding.map((source, index) => (
                                    <li key={index} className="truncate">
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary dark:text-indigo-400 hover:underline">
                                           {source.type === 'maps' ? <MapPinIcon className="w-3 h-3 mr-1.5 flex-shrink-0" /> : <GlobeIcon className="w-3 h-3 mr-1.5 flex-shrink-0" />}
                                           <span className="truncate" title={source.title}>{source.title}</span>
                                        </a>
                                        {source.type === 'maps' && source.placeAnswerSources?.reviewSnippets?.map((review, rIndex) => (
                                             <a key={rIndex} href={review.uri} target="_blank" rel="noopener noreferrer" className="mt-1 ml-4 flex items-center text-gray-500 dark:text-gray-400 hover:underline"><span className="text-lg mr-1.5">"</span><em className="truncate">{review.content}</em><span className="text-lg ml-0.5">"</span></a>
                                        ))}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                 <div className={`flex items-center gap-2 mt-1 transition-opacity duration-200 ${isUser ? 'justify-end' : 'justify-start'} ${isHovered && !message.ooc ? 'opacity-100' : 'opacity-0'}`}>
                    <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary" title="Edit"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={handleCopyToClipboard} className="text-gray-400 hover:text-primary" title="Copy">{copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}</button>
                    {!isUser && (
                        <>
                            <button onClick={() => onRegenerate(message.id)} className="text-gray-400 hover:text-primary disabled:text-gray-600" disabled={!isRegeneratable} title={isRegeneratable ? "Regenerate" : "Cannot regenerate"}><RefreshIcon className="w-4 h-4" /></button>
                            {ttsConfig.enabled && <button onClick={handlePlayTTS} disabled={isFetchingAudio} className="text-gray-400 hover:text-primary disabled:text-gray-600" title="Play audio"><PlayIcon className={`w-4 h-4 ${isFetchingAudio ? 'animate-pulse' : ''}`} /></button>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;