import * as React from 'react';
import { AppState, JournalEntry } from '../types';
import { generateJournalEntry } from '../services/aiService';
import { MenuIcon } from '../components/Icons';

interface JournalViewProps {
    appState: AppState;
    addJournalEntry: (entry: JournalEntry) => void;
    updateJournalEntry: (id: string, content: string) => void;
    isGenerating: boolean;
    setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
    openSidebar: () => void;
}

const JournalEntryCard: React.FC<{ entry: JournalEntry, onUpdate: (id: string, content: string) => void }> = ({ entry, onUpdate }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editContent, setEditContent] = React.useState(entry.content);

    const handleUpdate = () => {
        onUpdate(entry.id, editContent);
        setIsEditing(false);
    }
    
    return (
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">{new Date(entry.date).toLocaleDateString()}</h3>
                <button onClick={() => setIsEditing(!isEditing)} className="text-sm text-primary hover:underline">
                    {isEditing ? 'Cancel' : 'Edit'}
                </button>
            </div>
            {isEditing ? (
                <div>
                    <textarea 
                        value={editContent} 
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md"
                        rows={6}
                    />
                    <button onClick={handleUpdate} className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">
                        Save
                    </button>
                </div>
            ) : (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.content}</p>
            )}
        </div>
    );
};


const JournalView: React.FC<JournalViewProps> = ({ appState, addJournalEntry, updateJournalEntry, isGenerating, setIsGenerating, openSidebar }) => {

    const handleGenerateEntry = async () => {
        setIsGenerating(true);
        try {
            const content = await generateJournalEntry(appState);
            const newEntry: JournalEntry = {
                id: `journal-${Date.now()}`,
                date: new Date().toISOString(),
                content: content,
            };
            addJournalEntry(newEntry);
        } catch (error) {
            console.error("Failed to generate journal entry:", error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
            <header className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                <div className="flex items-center">
                    <button onClick={openSidebar} className="md:hidden mr-4 text-text-light dark:text-text-dark" aria-label="Open navigation menu">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-text-light dark:text-text-dark">{appState.companionSettings.name}'s Journal</h1>
                </div>
                <button 
                    onClick={handleGenerateEntry} 
                    disabled={isGenerating}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:bg-gray-400"
                >
                    {isGenerating ? 'Generating...' : 'New Entry'}
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {appState.journal.length > 0 ? (
                    appState.journal.map(entry => (
                        <JournalEntryCard key={entry.id} entry={entry} onUpdate={updateJournalEntry} />
                    ))
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                        <p>No journal entries yet.</p>
                        <p>Start a conversation or generate an entry to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JournalView;