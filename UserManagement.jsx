import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Shield, User as UserIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [currentUserData, allUsers] = await Promise.all([
          User.me(),
          User.list()
        ]);
        setCurrentUser(currentUserData);
        setUsers(allUsers);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleInviteUser = () => {
    // This would typically open a modal or redirect to invite functionality
    alert('To invite new users:\n\n1. Go to your app dashboard\n2. Navigate to Users section\n3. Click "Invite User"\n4. Send them the invite link\n\nEach restaurant should have their own separate account for data security.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#de6a2b' }}>
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-64 w-full mb-6" />
          <div className="grid gap-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#de6a2b' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
                  <Users className="w-6 h-6" style={{ color: '#E16B2A' }} />
                  User Management
                </CardTitle>
                <p className="mt-2" style={{ color: '#392F2D', opacity: 0.8 }}>
                  Manage access for your restaurant scheduling system
                </p>
              </div>
              <Button 
                onClick={handleInviteUser}
                className="font-semibold"
                style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Instructions */}
        <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
          <CardHeader>
            <CardTitle style={{ color: '#392F2D' }}>Multi-Restaurant Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
              <h4 className="font-semibold mb-2" style={{ color: '#392F2D' }}>
                📋 How It Works
              </h4>
              <ul className="space-y-2 text-sm" style={{ color: '#392F2D' }}>
                <li>• Each restaurant gets their own separate account</li>
                <li>• Schedules and data are completely private to each user</li>
                <li>• Managers can only see their own restaurant's information</li>
                <li>• Use the invite system to add multiple users per restaurant</li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
              <h4 className="font-semibold mb-2" style={{ color: '#392F2D' }}>
                👥 Adding New Restaurants
              </h4>
              <ol className="space-y-2 text-sm" style={{ color: '#392F2D' }}>
                <li>1. Click "Invite User" above</li>
                <li>2. Send the invite link to the new restaurant manager</li>
                <li>3. They'll sign up and get their own private workspace</li>
                <li>4. Each restaurant's schedules remain completely separate</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Current Users */}
        <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
          <CardHeader>
            <CardTitle style={{ color: '#392F2D' }}>Current Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className={`p-4 rounded-lg border flex items-center justify-between ${
                    user.id === currentUser?.id ? 'ring-2' : ''
                  }`}
                  style={{ 
                    backgroundColor: user.id === currentUser?.id ? '#EADED2' : 'transparent',
                    borderColor: '#392F2D',
                    ringColor: user.id === currentUser?.id ? '#E16B2A' : 'transparent'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                      style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
                    >
                      {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?'}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2" style={{ color: '#392F2D' }}>
                        {user.full_name}
                        {user.id === currentUser?.id && (
                          <Badge style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}>You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className="flex items-center gap-1"
                      style={{ 
                        backgroundColor: user.role === 'admin' ? '#E16B2A' : '#EADED2',
                        color: user.role === 'admin' ? '#FFF2E2' : '#392F2D'
                      }}
                    >
                      <Shield className="w-3 h-3" />
                      {user.role === 'admin' ? 'Administrator' : 'Manager'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}