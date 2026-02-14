import * as React from 'react';
import { AppState } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { MenuIcon, DownloadIcon, TrashIcon, FileTextIcon, ImageIcon } from '../components/Icons';
import { exportProjectAsZip } from '../services/zipService';

interface SettingsViewProps {
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState>>;
    openSidebar: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-card-light dark:bg-card-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark mb-6">
        <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text-dark">{title}</h2>
        {children}
    </div>
);

const Input: React.FC<{ label: string; name: string; value: string; onChange: (e: any) => void; type?: string, placeholder?: string }> = ({ label, name, value, onChange, type = "text", placeholder }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
        <input type={type} name={name} value={value} onChange={onChange} className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md focus:ring-primary focus:border-primary" placeholder={placeholder} />
    </div>
);

const Textarea: React.FC<{ label: string; name: string; value: string; onChange: (e: any) => void; rows?: number }> = ({ label, name, value, onChange, rows = 3 }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
        <textarea name={name} value={value} onChange={onChange} rows={rows} className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md focus:ring-primary focus:border-primary" />
    </div>
);

const SettingsView: React.FC<SettingsViewProps> = ({ appState, setAppState, openSidebar }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const importInputRef = React.useRef<HTMLInputElement>(null);
    const [isZipping, setIsZipping] = React.useState(false);

    const handleChange = (section: keyof AppState, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const processedValue = type === 'checkbox' ? checked : (type === 'range' ? parseFloat(value) : value);
        
        setAppState(prev => ({ 
            ...prev, 
            [section]: { 
                ...(prev[section] || {}), 
                [name]: processedValue 
            } 
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            setAppState(prev => ({ ...prev, companionSettings: { ...prev.companionSettings, referenceImage: base64 } }));
        }
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure? This will delete all messages locally to free up memory.")) {
            setAppState(prev => ({ ...prev, chatHistory: [] }));
        }
    };

    const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const importedState = JSON.parse(content);
                if (importedState.companionSettings || importedState.chatHistory) {
                    setAppState(importedState);
                    alert("Backup restored successfully!");
                } else {
                    throw new Error("Invalid structure");
                }
            } catch (err) {
                console.error("Import error:", err);
                alert("Import failed. The file might be corrupted or in an incompatible format.");
            }
        };
        reader.readAsText(file);
        // Clear input value so same file can be imported twice if needed
        e.target.value = '';
    };

    const handleDownloadFullZip = async () => {
        setIsZipping(true);
        try {
            const projectMap = [
                'index.html', 'index.tsx', 'App.tsx', 'types.ts', 'constants.ts', 'metadata.json', 'service-worker.js',
                'hooks/usePersistentState.ts', 'utils/fileUtils.ts', 'services/aiService.ts', 
                'services/audioService.ts', 'services/zipService.ts', 'components/Icons.tsx', 
                'components/Sidebar.tsx', 'components/ChatMessage.tsx', 'components/ChatInput.tsx', 
                'components/PermissionModal.tsx', 'views/ChatView.tsx', 'views/SettingsView.tsx', 
                'views/JournalView.tsx', 'views/GalleryView.tsx', 'views/DevelopView.tsx'
            ];

            const zipFiles: Record<string, string> = {};
            let combinedSource = "";

            for (const path of projectMap) {
                try {
                    const res = await fetch(`./${path}`);
                    if (res.ok) {
                        const content = await res.text();
                        zipFiles[path] = content;
                        
                        // We bundle source code for the "Offline Runner" 
                        // index.tsx is usually the entry, we inline everything else first
                        if (path.endsWith('.tsx') || path.endsWith('.ts')) {
                           if (path !== 'index.tsx') {
                               combinedSource += `\n/* --- FILE: ${path} --- */\n` + content.replace(/import .* from .*/g, '// $&');
                           }
                        }
                    }
                } catch (e) { console.warn(`Failed to package ${path}`); }
            }

            // Entry point needs special handling (removing imports/exports for Babel UMD runtime)
            const indexContent = zipFiles['index.tsx'] || "";
            const entrySource = indexContent.replace(/import .* from .*/g, '// $&').replace(/export default .*/g, '// $&');
            combinedSource += `\n/* --- ENTRY: index.tsx --- */\n` + entrySource;

            // State file
            zipFiles['data.js'] = `window.INITIAL_APP_STATE = ${JSON.stringify(appState)};`;

            // OFFLINE index.html
            // This is the file the user opens on Android file://
            zipFiles['index.html'] = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appState.companionSettings.name} - Offline</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="data.js"></script>
    <style>
        body { background: #111827; }
        #root { height: 100vh; width: 100vw; overflow: hidden; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        /* Bundled Source Code */
        ${combinedSource}
    </script>
</body>
</html>`;

            zipFiles['README.txt'] = `ANDROID OFFLINE GUIDE:\n\n1. Extract this ZIP on your Android device.\n2. Open "index.html" in Chrome or Samsung Internet.\n3. The app will work perfectly without a server.\n4. All your source files are backed up in this folder.`;

            await exportProjectAsZip(zipFiles);
        } catch (e) {
            console.error("ZIP Error:", e);
            alert("Export failed. Try clearing history to reduce memory usage.");
        } finally { setIsZipping(false); }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
            <div className="flex items-center mb-6">
                <button onClick={openSidebar} className="md:hidden mr-4"><MenuIcon className="w-6 h-6" /></button>
                <h1 className="text-3xl font-bold">Settings</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Section title="Identity">
                        <Input label="Name" name="name" value={appState.companionSettings?.name || ''} onChange={(e) => handleChange('companionSettings', e)} />
                        <Textarea label="Persona" name="persona" value={appState.companionSettings?.persona || ''} onChange={(e) => handleChange('companionSettings', e)} rows={4} />
                        <div className="flex items-center gap-4 mt-2">
                            {appState.companionSettings?.referenceImage && <img src={appState.companionSettings.referenceImage} className="w-16 h-16 rounded-full object-cover border-2 border-primary" />}
                            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">Change Avatar</button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                        </div>
                    </Section>

                    <Section title="Project Management">
                        <p className="text-sm text-gray-500 mb-6">Backup your data or download the entire project structure for offline use.</p>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={handleDownloadFullZip} 
                                disabled={isZipping}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-3 shadow-lg font-bold text-lg active:scale-95 transition-all"
                            >
                                {isZipping ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Packaging...</> : <><DownloadIcon className="w-6 h-6" /> Export Project (Offline)</>}
                            </button>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => importInputRef.current?.click()} className="px-4 py-3 border border-border-light dark:border-border-dark rounded-xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800">Restore Backup</button>
                                <input type="file" ref={importInputRef} onChange={handleImportJson} className="hidden" accept=".json" />
                                <button onClick={handleClearHistory} className="px-4 py-3 border border-red-500 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50">Clear Data</button>
                            </div>
                        </div>
                    </Section>
                </div>

                <div>
                    <Section title="Voice & Display">
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold">Interface Sounds</label>
                                <input type="checkbox" name="uiSounds" checked={appState.interfaceSettings?.uiSounds ?? true} onChange={(e) => handleChange('interfaceSettings', e)} className="h-6 w-6 rounded text-primary border-gray-300"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Art Style</label>
                                <select name="artStyle" value={appState.companionSettings?.artStyle || 'photorealistic'} onChange={(e) => handleChange('companionSettings', e)} className="w-full p-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl">
                                    <option value="photorealistic">Photorealistic</option>
                                    <option value="anime">Anime Style</option>
                                </select>
                            </div>
                            <div className="pt-4 border-t border-border-light dark:border-border-dark">
                                 <div className="flex items-center mb-4">
                                    <input type="checkbox" id="ttsEnabled" name="enabled" checked={appState.ttsConfig?.enabled ?? false} onChange={(e) => handleChange('ttsConfig', e)} className="h-5 w-5 rounded text-primary"/>
                                    <label htmlFor="ttsEnabled" className="ml-3 block text-sm font-bold">Voice Output (TTS)</label>
                                </div>
                                {appState.ttsConfig?.enabled && (
                                    <select name="gender" value={appState.ttsConfig.gender} onChange={(e) => handleChange('ttsConfig', e)} className="w-full p-3 bg-background-light dark:bg-background-dark border rounded-xl text-sm">
                                        <option value="female">Kore (Smooth Female)</option>
                                        <option value="male">Puck (Warm Male)</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;