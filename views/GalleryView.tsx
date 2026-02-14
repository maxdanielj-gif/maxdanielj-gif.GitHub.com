import * as React from 'react';
import JSZip from 'jszip';
import { AppState, ImageMetadata } from '../types';
import { DownloadIcon, MenuIcon, CheckSquareIcon, SquareIcon } from '../components/Icons';

interface GalleryViewProps {
    appState: AppState;
    openSidebar: () => void;
    updateImageTags: (messageId: string, tags: string[]) => void;
}

const ImageDetailModal: React.FC<{
    msgId: string;
    image: ImageMetadata;
    onClose: () => void;
    onUpdateTags: (tags: string[]) => void;
}> = ({ msgId, image, onClose, onUpdateTags }) => {
    const [tags, setTags] = React.useState(image.tags);
    const [inputValue, setInputValue] = React.useState('');

    const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
            e.preventDefault();
            const newTag = inputValue.trim().replace(/^#/, ''); // Strip leading #
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = () => {
        onUpdateTags(tags);
        onClose();
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        const fileName = `companion-image-${new Date(image.timestamp).getTime()}.png`;
        link.download = fileName;
        link.href = image.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl p-4 md:p-6 w-full max-w-5xl mx-4 flex flex-col md:flex-row gap-6 max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="md:w-2/3 flex items-center justify-center bg-background-dark rounded-lg">
                    <img src={image.src} alt={image.prompt} className="w-full h-auto object-contain rounded-lg max-h-[85vh]" />
                </div>
                <div className="md:w-1/3 flex flex-col h-full">
                    <h3 className="text-xl font-bold mb-2 text-text-light dark:text-text-dark">Image Details</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Generated on {new Date(image.timestamp).toLocaleString()}</p>
                    <div className="text-sm space-y-2 mb-4 overflow-y-auto pr-2 text-text-light dark:text-text-dark flex-grow">
                        <p><strong>Prompt:</strong> {image.prompt}</p>
                    </div>
                    <div className="mt-auto space-y-4 pt-4 border-t border-border-light dark:border-border-dark">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Hashtags</label>
                            <div className="w-full p-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-md flex flex-wrap items-center gap-2 min-h-[42px]">
                                {tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 bg-primary text-white text-sm px-2 py-1 rounded-full">
                                        #{tag}
                                        <button onClick={() => removeTag(tag)} className="text-white hover:text-gray-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                    </span>
                                ))}
                                <input type="text" value={inputValue} onChange={handleTagInputChange} onKeyDown={handleTagInputKeyDown} className="flex-grow bg-transparent focus:outline-none" placeholder={tags.length === 0 ? "Add #hashtags..." : "Add another..."} />
                            </div>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                             <button onClick={handleDownload} className="p-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><DownloadIcon className="w-5 h-5"/></button>
                            <div className="flex gap-2">
                                <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Close</button>
                                <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover">Save Hashtags</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ImageCard: React.FC<{ msgId: string; image: ImageMetadata; onClick: () => void; isSelectMode: boolean; isSelected: boolean; onSelect: () => void; }> = ({ msgId, image, onClick, isSelectMode, isSelected, onSelect }) => {
    const handleClick = () => isSelectMode ? onSelect() : onClick();
    return (
        <div className={`relative group aspect-w-1 aspect-h-1 cursor-pointer`} onClick={handleClick}>
            <img src={image.src} alt={image.prompt} className={`w-full h-full object-cover rounded-lg shadow-md transition-all duration-200 ${isSelected ? 'ring-4 ring-primary ring-offset-2 dark:ring-offset-background-dark' : ''}`} />
            <div className={`absolute inset-0 bg-black transition-all duration-300 ${isSelected ? 'bg-opacity-40' : 'bg-opacity-0 group-hover:bg-opacity-60'}`}>
                {isSelectMode && (<div className="absolute top-2 right-2 text-white">{isSelected ? <CheckSquareIcon className="w-6 h-6" /> : <SquareIcon className="w-6 h-6 opacity-70 group-hover:opacity-100" />}</div>)}
                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 p-1">{image.tags.slice(0, 3).map(tag => (<span key={tag} className="bg-primary text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">#{tag}</span>))}</div>
            </div>
        </div>
    );
};


const GalleryView: React.FC<GalleryViewProps> = ({ appState, openSidebar, updateImageTags }) => {
    const [activeTab, setActiveTab] = React.useState<'generated' | 'uploaded'>('generated');
    const [selectedImage, setSelectedImage] = React.useState<ImageMetadata | null>(null);
    const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(null);
    const [tagFilter, setTagFilter] = React.useState('');
    const [isSelectMode, setIsSelectMode] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

    const { generatedImages, uploadedImages } = React.useMemo(() => {
        const genImgs: { msgId: string, image: ImageMetadata }[] = [];
        const upImgs: { msgId: string, image: ImageMetadata }[] = [];
        appState.chatHistory.forEach(msg => {
            if (msg.image) {
                if (msg.sender === 'ai') {
                    genImgs.push({ msgId: msg.id, image: msg.image });
                } else {
                    upImgs.push({ msgId: msg.id, image: msg.image });
                }
            }
        });
        genImgs.sort((a, b) => new Date(b.image.timestamp).getTime() - new Date(a.image.timestamp).getTime());
        upImgs.sort((a, b) => new Date(b.image.timestamp).getTime() - new Date(a.image.timestamp).getTime());
        return { generatedImages: genImgs, uploadedImages: upImgs };
    }, [appState.chatHistory]);

    const allTags = React.useMemo(() => {
        const tags = new Set<string>();
        [...generatedImages, ...uploadedImages].forEach(item => {
            item.image.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [generatedImages, uploadedImages]);

    const filteredImages = React.useMemo(() => {
        const source = activeTab === 'generated' ? generatedImages : uploadedImages;
        if (!tagFilter) {
            return source;
        }
        return source.filter(item => item.image.tags.includes(tagFilter));
    }, [activeTab, generatedImages, uploadedImages, tagFilter]);

    const handleToggleSelect = (msgId: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(msgId)) {
            newSelection.delete(msgId);
        } else {
            newSelection.add(msgId);
        }
        setSelectedIds(newSelection);
    };
    
    const handleSelectAll = () => {
        setSelectedIds(new Set(filteredImages.map(img => img.msgId)));
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleBatchDownload = async () => {
        const zip = new JSZip();
        const imagesToDownload = [...generatedImages, ...uploadedImages].filter(item => selectedIds.has(item.msgId));
        
        for (const item of imagesToDownload) {
            const base64Data = item.image.src.split(',')[1];
            zip.file(`image_${item.msgId}.png`, base64Data, { base64: true });
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "companion_gallery_export.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        setIsSelectMode(false);
        setSelectedIds(new Set());
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
            <header className="p-4 border-b border-border-light dark:border-border-dark flex items-center">
                <button onClick={openSidebar} className="md:hidden mr-4 text-text-light dark:text-text-dark" aria-label="Open navigation menu">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-semibold text-text-light dark:text-text-dark">Photo Gallery</h1>
            </header>
            <div className="p-4 border-b border-border-light dark:border-border-dark flex flex-wrap items-center gap-4">
                {!isSelectMode ? (
                    <>
                        <div className="flex space-x-2">
                            <button onClick={() => setActiveTab('generated')} className={`px-4 py-2 rounded-md font-medium text-sm ${activeTab === 'generated' ? 'bg-primary text-white' : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark'}`}>
                                Generated ({generatedImages.length})
                            </button>
                            <button onClick={() => setActiveTab('uploaded')} className={`px-4 py-2 rounded-md font-medium text-sm ${activeTab === 'uploaded' ? 'bg-primary text-white' : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark'}`}>
                                Uploaded ({uploadedImages.length})
                            </button>
                        </div>
                        <div className="flex flex-grow items-center gap-2 overflow-x-auto pb-2 -mb-2">
                            <button 
                                onClick={() => setTagFilter('')}
                                className={`flex-shrink-0 px-3 py-1 rounded-full font-medium text-sm transition-colors ${!tagFilter ? 'bg-primary text-white' : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                All
                            </button>
                            {allTags.map(tag => (
                                <button 
                                    key={tag} 
                                    onClick={() => setTagFilter(tag)}
                                    className={`flex-shrink-0 px-3 py-1 rounded-full font-medium text-sm transition-colors ${tagFilter === tag ? 'bg-primary text-white' : 'bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setIsSelectMode(true)} className="px-4 py-2 ml-auto rounded-md font-medium text-sm bg-secondary text-white">Select</button>
                    </>
                ) : (
                    <div className="w-full flex flex-wrap items-center gap-2">
                        <span className="font-bold">{selectedIds.size} selected</span>
                        <div className="flex gap-2 ml-4">
                             <button onClick={handleSelectAll} className="px-3 py-1 text-sm rounded-md bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">Select All</button>
                             <button onClick={handleDeselectAll} className="px-3 py-1 text-sm rounded-md bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">Deselect All</button>
                        </div>
                        <div className="ml-auto flex gap-2">
                             <button onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }} className="px-4 py-2 rounded-md text-sm bg-gray-500 text-white">Cancel</button>
                             <button onClick={handleBatchDownload} disabled={selectedIds.size === 0} className="px-4 py-2 rounded-md text-sm bg-primary text-white disabled:bg-gray-400">Download Selected</button>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {filteredImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredImages.map(({ msgId, image }) => (
                            <ImageCard 
                                key={msgId} 
                                msgId={msgId} 
                                image={image}
                                isSelectMode={isSelectMode}
                                isSelected={selectedIds.has(msgId)}
                                onSelect={() => handleToggleSelect(msgId)}
                                onClick={() => {
                                    setSelectedImage(image);
                                    setSelectedMessageId(msgId);
                                }} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                        <p>No {activeTab} images found{tagFilter && ' with that tag'}.</p>
                        <p>{activeTab === 'generated' ? 'Ask your companion to generate a photo.' : 'Upload an image in the chat.'}</p>
                    </div>
                )}
            </div>
            {selectedImage && selectedMessageId && (
                <ImageDetailModal
                    msgId={selectedMessageId}
                    image={selectedImage}
                    onClose={() => {
                        setSelectedImage(null);
                        setSelectedMessageId(null);
                    }}
                    onUpdateTags={(tags) => updateImageTags(selectedMessageId, tags)}
                />
            )}
        </div>
    );
};

export default GalleryView;