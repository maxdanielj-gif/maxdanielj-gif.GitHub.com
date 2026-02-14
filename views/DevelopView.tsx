import * as React from 'react';
import { AppState, MemoryEntry } from '../types';
import { generateSelfReflection } from '../services/aiService';
import { MenuIcon, PlusCircleIcon, EditIcon, TrashIcon, GlobeIcon } from '../components/Icons';

interface MemoriesViewProps {
    appState: AppState;
    addMemory: (content: string) => void;
    updateMemory: (id: string, content: string) => void;
    deleteMemory: (id: string) => void;
    openSidebar: () => void;
}

const MemoryCard: React.FC<{
    entry: MemoryEntry;
    onUpdate: (id: string, content: string) => void;
    onDelete: (id: string) => void;
}> = ({ entry, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editContent, setEditContent] = React.useState(entry.content);

    const handleUpdate = () => {
        if (editContent.trim()) {
            onUpdate(entry.id, editContent.trim());
            setIsEditing(false);
        }
    };

    return (
        <div className="bg-card-light dark:bg-card-dark p-4 rounded-lg shadow-sm border border-border-light dark:border-border-dark flex items-center justify-between gap-4">
            {isEditing ? (
                <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleUpdate}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpdate(); } }}
                    className="w-full bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md p-2 resize-none"
                    rows={2}
                    autoFocus
                />
            ) : (
                <div className="flex-grow">
                    <p className="text-gray-700 dark:text-gray-300">{entry.content}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
            )}
            <div className="flex-shrink-0 flex items-center gap-2">
                <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-primary"><EditIcon className="w-5 h-5" /></button>
                <button onClick={() => onDelete(entry.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

const MemoriesView: React.FC<MemoriesViewProps> = ({ appState, addMemory, updateMemory, deleteMemory, openSidebar }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [suggestions, setSuggestions] = React.useState<string[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [newMemory, setNewMemory] = React.useState('');

    const handleReflect = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);
        try {
            const newSuggestions = await generateSelfReflection(appState);
            if (newSuggestions.length === 0) {
                setError("I couldn't find any new insights from our recent conversation. Let's chat some more and then try again!");
            } else {
                setSuggestions(newSuggestions);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSuggestion = (suggestion: string) => {
        addMemory(suggestion);
        setSuggestions(prev => prev.filter(s => s !== suggestion));
    };

    const handleAddManualMemory = () => {
        if (newMemory.trim()) {
            addMemory(newMemory.trim());
            setNewMemory('');
        }
    };
    
    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
            <header className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                <div className="flex items-center">
                    <button onClick={openSidebar} className="md:hidden mr-4 text-text-light dark:text-text-dark" aria-label="Open navigation menu"><MenuIcon className="w-6 h-6" /></button>
                    <h1 className="text-xl font-semibold text-text-light dark:text-text-dark">Memories & Development</h1>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Core Memories */}
                        <div className="space-y-6">
                            <div>
                               <h2 className="text-2xl font-bold mb-4 text-text-light dark:text-text-dark">Core Memories</h2>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={newMemory}
                                        onChange={(e) => setNewMemory(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddManualMemory()}
                                        placeholder="Add a new memory..."
                                        className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md"
                                    />
                                    <button onClick={handleAddManualMemory} className="px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:bg-secondary-hover">Add</button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {appState.memories.length > 0 ? (
                                    appState.memories.map(entry => (
                                        <MemoryCard key={entry.id} entry={entry} onUpdate={updateMemory} onDelete={deleteMemory} />
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 dark:text-gray-400 pt-4">No memories yet. Add one manually or use the self-reflection tool.</p>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Self-Reflection */}
                        <div className="space-y-6">
                            <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
                                <h2 className="text-xl font-bold mb-2 text-text-light dark:text-text-dark">Self-Reflection</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Your companion can analyze your recent conversations to discover new aspects of its personality, likes, and dislikes.
                                </p>
                                <button onClick={handleReflect} disabled={isLoading || appState.chatHistory.length < 5} className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover disabled:bg-gray-400 transition-colors">
                                    {isLoading ? 'Reflecting...' : 'Begin Self-Reflection'}
                                </button>
                                {appState.chatHistory.length < 5 && <p className="text-xs text-center text-gray-500 mt-2">More conversation history needed for reflection.</p>}
                            </div>

                            {isLoading && <div className="text-center py-10"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>}
                            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p>{error}</p></div>}

                            {suggestions.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-3">Suggested New Memories</h3>
                                    <ul className="space-y-3">
                                        {suggestions.map((suggestion, index) => (
                                            <li key={index} className="flex items-center justify-between p-3 bg-background-light dark:bg-background-dark rounded-md border border-border-light dark:border-border-dark">
                                                <p className="text-gray-700 dark:text-gray-300 flex-grow italic">"{suggestion}"</p>
                                                <button onClick={() => handleAddSuggestion(suggestion)} title="Add to Core Memory" className="ml-4 p-2 text-gray-400 hover:text-primary transition-colors"><PlusCircleIcon className="w-6 h-6" /></button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Interaction Guide Section */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-500 rounded-lg text-white">
                                <GlobeIcon className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">Interaction Guide</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-200 mb-2 underline decoration-indigo-300">Out Of Character (OOC)</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    Wrap your text in parentheses <code className="bg-indigo-200 dark:bg-indigo-800 px-1 rounded font-bold">(like this)</code> to talk directly to the AI core instead of the character. 
                                </p>
                                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                                        <span>Correct behavior: <span className="italic">"(Please don't be so sarcastic right now.)"</span></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                                        <span>Change scenario: <span className="italic">"(Let's pretend we just arrived at a futuristic space station.)"</span></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                                        <span>Meta-questions: <span className="italic">"(Why did you respond that way based on your persona?)"</span></span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-200 mb-2 underline decoration-indigo-300">Character Immersion</h3>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    Normal messages go to the character. Your companion uses asterisks to describe actions and feelings, and expects the same from you for deep immersion.
                                </p>
                                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                                        <span>Describe actions: <span className="italic">"*I wave goodbye and start walking away slowly.*"</span></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                                        <span>Express feelings: <span className="italic">"*I feel a sense of relief wash over me.*"</span></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemoriesView;