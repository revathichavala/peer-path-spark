import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MongoLoginForm } from './MongoLoginForm';
import { useMongoAuthContext } from './MongoAuthProvider';
import { Database, Server, Users, Activity } from 'lucide-react';

interface BackendSelectorProps {
  onSelect: (backend: 'supabase' | 'mongodb' | 'both') => void;
  currentBackend: 'supabase' | 'mongodb' | 'both';
}

export const BackendSelector: React.FC<BackendSelectorProps> = ({
  onSelect,
  currentBackend
}) => {
  const { user: mongoUser, isAuthenticated: isMongoAuthenticated, logout } = useMongoAuthContext();
  const [showMongoLogin, setShowMongoLogin] = useState(false);

  const handleMongoSelect = () => {
    if (isMongoAuthenticated) {
      onSelect('mongodb');
    } else {
      setShowMongoLogin(true);
    }
  };

  const handleMongoLoginSuccess = () => {
    setShowMongoLogin(false);
    onSelect('mongodb');
  };

  const handleLogout = async () => {
    await logout();
    onSelect('supabase');
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Backend Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supabase Backend */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Supabase</span>
                </div>
                <Badge variant="default">Connected</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                PostgreSQL database with real-time subscriptions and authentication
              </p>
              <Button
                variant={currentBackend === 'supabase' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelect('supabase')}
                className="w-full"
              >
                Use Supabase Only
              </Button>
            </div>

            {/* MongoDB Backend */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="font-medium">MongoDB + Flask</span>
                </div>
                <Badge variant={isMongoAuthenticated ? 'default' : 'secondary'}>
                  {isMongoAuthenticated ? 'Authenticated' : 'Not Connected'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                MongoDB with Flask backend for real-time chat and assessments
              </p>
              {isMongoAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-3 w-3" />
                    <span>Logged in as {mongoUser?.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={currentBackend === 'mongodb' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSelect('mongodb')}
                      className="flex-1"
                    >
                      Use MongoDB
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMongoSelect}
                  className="w-full"
                >
                  Connect to MongoDB
                </Button>
              )}
            </div>
          </div>

          {/* Both Backends Option */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Hybrid Mode</span>
              </div>
              <Badge variant={currentBackend === 'both' ? 'default' : 'outline'}>
                {isMongoAuthenticated ? 'Available' : 'Requires MongoDB Auth'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Use both backends - Supabase for core features and MongoDB for enhanced real-time capabilities
            </p>
            <Button
              variant={currentBackend === 'both' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelect('both')}
              disabled={!isMongoAuthenticated}
              className="w-full"
            >
              Use Both Backends
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showMongoLogin} onOpenChange={setShowMongoLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to MongoDB Backend</DialogTitle>
          </DialogHeader>
          <MongoLoginForm
            onSuccess={handleMongoLoginSuccess}
            onCancel={() => setShowMongoLogin(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};