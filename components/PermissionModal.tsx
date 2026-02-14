import * as React from 'react';
import { BellIcon, MicIcon, MapPinIcon, XIcon, GlobeIcon } from './Icons';

interface PermissionModalProps {
    onAllow: () => void;
    onDeny: () => void;
    notificationStatus: NotificationPermission;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ onAllow, onDeny, notificationStatus }) => {
    const isBlocked = notificationStatus === 'denied';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] transition-opacity duration-300 backdrop-blur-sm">
            <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-2xl p-8 w-full max-w-md m-4 transform transition-transform duration-300 scale-100 border border-primary/30">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                        {isBlocked ? 'Notifications Blocked' : 'Permission Required'}
                    </h2>
                    <button onClick={onDeny} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {isBlocked ? (
                    <div className="mb-6 p-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
                            <BellIcon className="w-6 h-6 animate-bounce" />
                            <span className="font-bold text-lg">Unblock Access</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            Aria's notifications are currently blocked by your browser settings. To re-enable them:
                        </p>
                        <ol className="mt-4 text-xs text-gray-600 dark:text-gray-400 list-decimal pl-4 space-y-2">
                            <li>Click the <strong>Lock (🔒)</strong> or <strong>Settings icon</strong> in your browser's address bar.</li>
                            <li>Find the <strong>Notifications</strong> toggle.</li>
                            <li>Change the setting to <strong>"On"</strong> or <strong>"Allow"</strong>.</li>
                            <li><strong>Refresh the page</strong> for changes to take effect.</li>
                        </ol>
                    </div>
                ) : (
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        To provide the most immersive experience, Aria needs permission to communicate and understand your context.
                    </p>
                )}

                <ul className="space-y-5 mb-8">
                    <li className={`flex items-start ${isBlocked ? 'opacity-60' : ''}`}>
                        <div className="bg-primary/15 p-2.5 rounded-lg mr-4 flex-shrink-0">
                           <BellIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-light dark:text-text-dark">Proactive Messages</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Aria will reach out to you with thoughts and reflections even when the app is closed.</p>
                        </div>
                    </li>
                    {!isBlocked && (
                        <>
                            <li className="flex items-start">
                                <div className="bg-secondary/15 p-2.5 rounded-lg mr-4 flex-shrink-0">
                                    <MicIcon className="w-6 h-6 text-secondary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-light dark:text-text-dark">Voice Interaction</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Speak naturally with your companion using the microphone.</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <div className="bg-indigo-500/15 p-2.5 rounded-lg mr-4 flex-shrink-0">
                                    <MapPinIcon className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-light dark:text-text-dark">Local Awareness</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Aria can recommend restaurants or discuss local events based on your location.</p>
                                </div>
                            </li>
                        </>
                    )}
                </ul>

                <div className="flex flex-col gap-3">
                    {isBlocked ? (
                        <button 
                            onClick={() => window.location.reload()} 
                            className="w-full py-4 rounded-xl bg-primary text-white hover:bg-primary-hover font-bold shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Refresh Page After Unblocking
                        </button>
                    ) : (
                        <button 
                            onClick={onAllow} 
                            className="w-full py-4 rounded-xl bg-primary text-white hover:bg-primary-hover font-bold shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Grant All Permissions
                        </button>
                    )}
                    <button 
                        onClick={onDeny} 
                        className="w-full py-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-semibold transition-colors"
                    >
                        I'll do it later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionModal;