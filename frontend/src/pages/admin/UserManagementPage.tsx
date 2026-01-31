import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users as UsersIcon } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button, Modal } from '../../components/common';
import { getUsers, updateUserRole } from '../../services/api';
import type { User } from '../../types';

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  editor: 'bg-blue-100 text-blue-800 border-blue-200',
  viewer: 'bg-green-100 text-green-800 border-green-200',
  user: 'bg-gray-100 text-gray-800 border-gray-200',
};

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  editor: 'Editor',
  viewer: 'Viewer',
  user: 'User',
};

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  // Redirect if not super_admin
  useEffect(() => {
    if (currentUser?.role !== 'super_admin') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUsers();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const handleRoleChange = (user: User, newRole: string) => {
    setSelectedUser(user);
    setSelectedRole(newRole);
    setIsConfirmModalOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      setUpdating(true);
      await updateUserRole(selectedUser.id, selectedRole);

      // Update local state
      setUsers(users.map(u =>
        u.id === selectedUser.id ? { ...u, role: selectedRole as User['role'] } : u
      ));

      setIsConfirmModalOpen(false);
      setSelectedUser(null);
      setSelectedRole('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const isOwnAccount = (user: User) => user.id === currentUser?.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage user roles and permissions
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isOwnAccount(user) ? (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            ROLE_COLORS[user.role]
                          }`}
                        >
                          {ROLE_LABELS[user.role]}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          className="px-3 py-1 rounded-lg text-xs font-medium border border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer"
                        >
                          <option value="user">User</option>
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              No users found
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !updating && setIsConfirmModalOpen(false)}
        title="Confirm Role Change"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Change <strong>{selectedUser?.email}</strong> role from{' '}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedUser ? ROLE_COLORS[selectedUser.role] : ''}`}>
              {selectedUser && ROLE_LABELS[selectedUser.role]}
            </span>{' '}
            to{' '}
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedRole ? ROLE_COLORS[selectedRole as User['role']] : ''}`}>
              {selectedRole && ROLE_LABELS[selectedRole as User['role']]}
            </span>?
          </p>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmRoleChange}
              loading={updating}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
