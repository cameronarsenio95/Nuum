import { useState } from 'react';
import { Upload, Camera, Key, Mail, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AccountSettingsProps {
  profile: {
    avatar_url: string;
    full_name: string;
  };
  onAvatarUpdate: (url: string) => void;
}

export function AccountSettings({ profile, onAvatarUpdate }: AccountSettingsProps) {
  const { user, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('content')
        .getPublicUrl(filePath);

      onAvatarUpdate(publicUrl);
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' });
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      setChangingPassword(true);
      setMessage(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }

    try {
      setMessage({ type: 'success', text: 'Deleting account...' });

      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');

      if (error) throw error;

      await signOut();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Account deletion requires admin privileges. Please contact support.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <h3 className="text-lg font-medium mb-6">Profile Picture</h3>

        <div className="flex items-center gap-6">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-linear-accent flex items-center justify-center text-3xl font-medium text-black">
                {profile.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-2 bg-linear-accent rounded-full cursor-pointer hover:bg-linear-accent-hover linear-transition"
            >
              <Camera className="w-4 h-4 text-black" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <p className="text-sm dark:text-text-secondary light:text-text-light-secondary mb-2">
              Upload a profile picture. Recommended size: 400x400px
            </p>
            <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">
              Accepted formats: JPG, PNG, GIF (max 5MB)
            </p>
            {uploading && (
              <p className="text-xs text-linear-accent mt-2">Uploading...</p>
            )}
          </div>
        </div>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border dark:border-linear-border-subtle light:border-linear-light-border-subtle rounded-linear-lg p-6">
        <h3 className="text-lg font-medium mb-4">Security</h3>

        <div className="space-y-3">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-4 dark:bg-linear-bg light:bg-linear-light-bg border dark:border-linear-border light:border-linear-light-border rounded-linear hover:dark:bg-linear-bg-subtle light:bg-linear-light-bg-subtle linear-transition"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium text-sm">Change Password</p>
                <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Update your password</p>
              </div>
            </div>
            <span className="text-sm dark:text-text-secondary light:text-text-light-secondary">→</span>
          </button>
        </div>
      </div>

      <div className="dark:bg-linear-bg-secondary light:bg-linear-light-bg-secondary border border-linear-error/20 rounded-linear-lg p-6">
        <h3 className="text-lg font-medium mb-4 text-linear-error">Danger Zone</h3>

        <div className="space-y-3">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-between p-4 bg-linear-error/10 border border-linear-error/20 rounded-linear hover:bg-linear-error/20 linear-transition"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-linear-error" />
              <div className="text-left">
                <p className="font-medium text-sm text-linear-error">Delete Account</p>
                <p className="text-xs dark:text-text-tertiary light:text-text-light-tertiary">Permanently delete your account and all data</p>
              </div>
            </div>
            <span className="text-sm text-linear-error">→</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-linear border ${
          message.type === 'success'
            ? 'bg-linear-success/10 border-linear-success-border/20 text-linear-success'
            : 'bg-linear-error/10 border-linear-error-border/20 text-linear-error'
        }`}>
          {message.text}
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-linear-bg-secondary border border-linear-border rounded-linear-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-medium mb-6">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="Enter new password"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-border rounded-linear focus:outline-none focus:border-linear-accent"
                  placeholder="Confirm new password"
                  minLength={8}
                />
              </div>
              <p className="text-xs text-text-tertiary">
                Password must be at least 8 characters long
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setMessage(null);
                  }}
                  className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-linear-bg-secondary border border-linear-error/20 rounded-linear-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-linear-error" />
              <h3 className="text-xl font-medium text-linear-error">Delete Account</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm dark:text-text-secondary light:text-text-light-secondary">
                This action cannot be undone. This will permanently delete your account and remove all data associated with it.
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Type <span className="font-mono text-linear-error">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full px-4 py-2 bg-linear-bg border border-linear-error/20 rounded-linear focus:outline-none focus:border-linear-error"
                  placeholder="DELETE"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm('');
                    setMessage(null);
                  }}
                  className="flex-1 px-4 py-2 bg-linear-bg-subtle hover:bg-linear-border-subtle rounded-linear linear-transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE'}
                  className="flex-1 px-4 py-2 bg-linear-error hover:bg-linear-error/90 text-white rounded-linear linear-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
