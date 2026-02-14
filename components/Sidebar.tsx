import * as React from 'react';
import { View } from '../types';
import { ChatIcon, SettingsIcon, JournalIcon, GalleryIcon, SunIcon, MoonIcon, BrainIcon } from './Icons';
import { MOCK_AI_NAME } from '../constants';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors text-left ${
            isActive
                ? 'bg-primary text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
        {icon}
        <span className="ml-4 font-medium">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, theme, toggleTheme, isOpen, setIsOpen }) => {
    
    const handleNavigate = (view: View) => {
        setCurrentView(view);
        setIsOpen(false);
    };

    return (
        <nav className={`w-64 flex-shrink-0 h-full bg-card-light dark:bg-card-dark border-r border-border-light dark:border-border-dark p-4 flex flex-col fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Main navigation">
            <div className="text-2xl font-bold text-primary mb-8 px-2">{MOCK_AI_NAME} Companion</div>
            <div className="flex-grow">
                <NavItem icon={<ChatIcon className="w-6 h-6" />} label="Chat" isActive={currentView === 'chat'} onClick={() => handleNavigate('chat')} />
                <NavItem icon={<BrainIcon className="w-6 h-6" />} label="Memories" isActive={currentView === 'memories'} onClick={() => handleNavigate('memories')} />
                <NavItem icon={<GalleryIcon className="w-6 h-6" />} label="Gallery" isActive={currentView === 'gallery'} onClick={() => handleNavigate('gallery')} />
                <NavItem icon={<JournalIcon className="w-6 h-6" />} label="Journal" isActive={currentView === 'journal'} onClick={() => handleNavigate('journal')} />
                <NavItem icon={<SettingsIcon className="w-6 h-6" />} label="Settings" isActive={currentView === 'settings'} onClick={() => handleNavigate('settings')} />
            </div>
            <div className="mt-auto">
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center p-3 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                    <span className="ml-4 font-medium">Toggle Theme</span>
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;