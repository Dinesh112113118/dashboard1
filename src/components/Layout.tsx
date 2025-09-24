import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import SettingsPage from './SettingsPage';
import HelpPage from './HelpPage';
import { Issue, Notification } from '../types';
import api from '../services/api';
import IssueDetailModal from './IssueDetailModal';
import { AlertCircle, CheckCircle2, Truck } from './icons';

const Layout: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [searchEnterTrigger, setSearchEnterTrigger] = useState(0);
  
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);
      const fetchedIssues = await api.getIssues();
      setIssues(fetchedIssues);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
      setError("Could not connect to the server. Please ensure the API is running and the URL in your .env file is correct.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);
  
  // Generate notifications based on fetched data
  useEffect(() => {
    if (issues.length > 0) {
      const generated: Notification[] = [];
      const critical = issues.find(i => i.priority === 'Critical' && i.status === 'Pending');
      if(critical) generated.push({ id: 'notif-1', issueId: critical.id, icon: AlertCircle, title: 'Critical Alert', description: `New issue #${critical.id}`, timestamp: critical.submittedAt, read: false });

      const resolved = issues.find(i => i.status === 'Resolved' && i.resolvedAt && (new Date().getTime() - i.resolvedAt.getTime()) < 86400000); // resolved in last 24h
      if(resolved) generated.push({ id: 'notif-2', issueId: resolved.id, icon: CheckCircle2, title: 'Issue Resolved', description: `Issue #${resolved.id} was resolved.`, timestamp: resolved.resolvedAt!, read: true });
      
      const inProgress = issues.find(i => i.status === 'In Progress');
      if(inProgress) generated.push({ id: 'notif-3', issueId: inProgress.id, icon: Truck, title: 'Dispatch Alert', description: `Issue #${inProgress.id} dispatched.`, timestamp: new Date(), read: false });

      setNotifications(generated.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));
    }
  }, [issues]);


  const handleSearchEnter = () => {
    setSearchEnterTrigger(prev => prev + 1);
  };
  
  const handleCloseModal = () => {
    setSelectedIssue(null);
  };

  const handleUpdateIssue = async (issueId: string, updates: Partial<Issue>) => {
    try {
      await api.updateIssue(issueId, updates);
      await fetchIssues(); // Refetch for consistency
    } catch (err) {
      console.error("Failed to update issue:", err);
      // You could add a user-facing error message here (e.g., using a toast library)
    }
    handleCloseModal();
  };

  const handleDeleteIssue = async (issueId: string) => {
    try {
      await api.deleteIssue(issueId);
      await fetchIssues(); // Refetch for consistency
    } catch (err) {
      console.error("Failed to delete issue:", err);
    }
    handleCloseModal();
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationSelect = (notification: Notification) => {
    setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
    
    if (notification.issueId) {
      const issueToShow = issues.find(issue => issue.id === notification.issueId);
      if (issueToShow) {
        setSelectedIssue(issueToShow);
      }
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-on-surface-variant font-medium">Connecting to server...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center bg-error-container text-on-error-container p-8 rounded-2xl max-w-lg">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Connection Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'settings':
        return <SettingsPage issues={issues} />;
      case 'help':
        return <HelpPage />;
      default:
        return (
          <Dashboard 
            issues={issues}
            searchTerm={searchTerm} 
            activeView={activeView}
            selectedDepartment={selectedDepartment}
            onDepartmentSelect={setSelectedDepartment}
            searchEnterTrigger={searchEnterTrigger}
            onUpdateIssue={handleUpdateIssue}
            onDeleteIssue={handleDeleteIssue}
            onIssueClick={setSelectedIssue}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen flex bg-background font-sans">
      <Sidebar 
        selectedDepartment={selectedDepartment} 
        onDepartmentSelect={setSelectedDepartment}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          onSearchEnter={handleSearchEnter}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onNotificationSelect={handleNotificationSelect}
        />
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
      
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          isOpen={!!selectedIssue}
          onClose={handleCloseModal}
          onUpdateIssue={handleUpdateIssue}
          onDeleteIssue={handleDeleteIssue}
        />
      )}
    </div>
  );
};

export default Layout;
