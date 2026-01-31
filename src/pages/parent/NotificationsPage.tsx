import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import './NotificationsPage.css';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    created_at: string;
}

export const NotificationsPage: React.FC = () => {
    const { activeWorkspace } = useWorkspaceStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const addLog = (msg: string) => setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const fetchNotifications = async () => {
        if (!activeWorkspace) return;
        try {
            setLoading(true);
            const data = await api.getNotifications(activeWorkspace.id);
            setNotifications(data);
        } catch (err) {
            console.error("Failed to load notifications", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendTest = async () => {
        if (!activeWorkspace) return;
        try {
            await api.sendTestNotification(activeWorkspace.id);
            fetchNotifications(); // Reload list
        } catch (err) {
            alert("Erreur lors de l'envoi du test. Vérifiez la console.");
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [activeWorkspace]);

    const handleRead = async (notif: Notification) => {
        if (!notif.is_read) {
            await api.markNotificationAsRead(notif.id);
            // Update local state
            setNotifications(prev => prev.map(n =>
                n.id === notif.id ? { ...n, is_read: true } : n
            ));
        }

        // Toggle expand if it has data
        if (notif.data && Object.keys(notif.data).length > 0) {
            setExpandedId(expandedId === notif.id ? null : notif.id);
        }
    };

    if (loading) return <div className="notifications-page loading">Chargement...</div>;

    return (
        <div className="notifications-page">
            <header className="notifications-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Boîte de réception</h1>
                        <p>Retrouvez ici les rapports et alertes concernant vos enfants.</p>
                    </div>
                    <button onClick={handleSendTest} className="btn-secondary" style={{ padding: '8px 16px' }}>
                        🔔 Test v2
                    </button>
                </div>
            </header>

            {/* DEBUG SECTION */}
            <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
                <strong>Debug Info:</strong><br />
                Workspace: {activeWorkspace?.id || 'None'} <br />
                Items: {notifications.length} <br />
                API Error: {debugLog.length > 0 ? 'Yes' : 'No'}
                <ul>
                    {debugLog.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
            </div>

            <div className="notifications-list">
                {notifications.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <p>Aucune notification pour le moment.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`notification-card ${notif.is_read ? 'read' : 'unread'} ${notif.type}`}
                            onClick={() => handleRead(notif)}
                        >
                            <div className="notif-icon">
                                {notif.type === 'evaluation_report' ? '🎓' : '📢'}
                            </div>
                            <div className="notif-content">
                                <div className="notif-top">
                                    <h3>{notif.title}</h3>
                                    <span className="notif-date">
                                        {new Date(notif.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="notif-preview">{notif.message}</p>

                                {expandedId === notif.id && notif.data && (
                                    <div className="notif-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Score Inhibition</span>
                                            <span className="detail-value">{notif.data.inhibitionScore ?? '-'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Score Noise</span>
                                            <span className="detail-value">{notif.data.noiseScore ?? '-'}</span>
                                        </div>
                                        {notif.data.recommendation && (
                                            <div className="recommendation-box">
                                                <strong>💡 Recommandation du Dr. Neuro :</strong>
                                                <p>{notif.data.recommendation}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!notif.is_read && <div className="unread-dot" />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
