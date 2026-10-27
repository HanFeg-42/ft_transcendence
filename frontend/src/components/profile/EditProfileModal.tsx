
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import PixelButton from '../ui/PixelButton';
import type { ProfileData } from '../../services/userService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData | null;
  onSave: (data: {
    username?: string;
    bio?: string;
    avatar?: string;
  }) => Promise<void>;
  token: string | null;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
  token,
}: EditProfileModalProps) {
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Remplir les champs quand la modal s'ouvre.
  useEffect(() => {
    if (isOpen && profile) {
      setDisplayName(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
      setError(null);
    }
  }, [isOpen, profile]);

  // Fermer avec Échap.
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSave({
        username: displayName.trim() || undefined,
        bio: bio.trim(),
        avatar: avatarUrl.trim() || undefined,
      });

      onClose();
    } catch (err: unknown) {
      console.error('[EDIT-PROFILE] Failed to save:', err);
      setError(t('userProfile_saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError(t('userProfile_fileTooLarge'));
      e.target.value = '';
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/users/profile/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Avatar upload failed');
      }

      const data = await res.json();
      setAvatarUrl(data.avatarUrl);
    } catch (err: unknown) {
      console.error('[EDIT-PROFILE] Avatar upload failed:', err);
      setError(t('userProfile_uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg"
      >
        <Card variant="green" className="p-6 bg-pacova-surface">
          <h2 className="font-pixelify text-2xl text-pacova-green uppercase tracking-widest mb-6 text-center">
            ▼ {t('userProfile_editTitle')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-pixelify text-sm text-pacova-green uppercase tracking-wider block mb-2">
                {t('userProfile_displayName')}
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                className="w-full bg-black/60 border border-pacova-green/40 rounded px-4 py-2 font-vt323 text-lg text-white focus:outline-none focus:border-pacova-green"
                placeholder={t('userProfile_namePlaceholder')}
              />
            </div>

            <div>
              <label className="font-pixelify text-sm text-pacova-green uppercase tracking-wider block mb-2">
                {t('userProfile_avatarUrl')}
              </label>

              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-black/60 border border-pacova-green/40 rounded px-4 py-2 font-vt323 text-lg text-white focus:outline-none focus:border-pacova-green"
                placeholder="https://..."
              />

              <div className="mt-2 text-center">
                <span className="font-vt323 text-xs text-gray-400">
                  {t('userProfile_or')}
                </span>
              </div>

              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-pacova-green/80 file:text-black hover:file:bg-pacova-green/40"
                />

                {uploading && (
                  <span className="font-vt323 text-xs text-pacova-green block mt-1">
                    {t('userProfile_uploading')}
                  </span>
                )}
              </div>

              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={t('userProfile_avatarPreview')}
                  className="w-20 h-20 rounded-full mt-2 object-cover border-2 border-pacova-green/40"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>

            <div>
              <label className="font-pixelify text-sm text-pacova-green uppercase tracking-wider block mb-2">
                {t('userProfile_bio')}
              </label>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full bg-black/60 border border-pacova-green/40 rounded px-4 py-2 font-vt323 text-lg text-white focus:outline-none focus:border-pacova-green resize-none"
                placeholder={t('userProfile_bioPlaceholder')}
              />

              <span className="font-vt323 text-xs text-gray-400 block text-right mt-1">
                {bio.length}/200
              </span>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded px-4 py-2">
                <p className="font-vt323 text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <PixelButton
                type="button"
                variant="gray"
                size="sm"
                onClick={onClose}
                className="flex-1"
                disabled={saving}
              >
                {t('userProfile_cancel')}
              </PixelButton>

              <PixelButton
                type="submit"
                variant="gray"
                size="sm"
                className="flex-1"
                disabled={saving}
              >
                {saving
                  ? t('userProfile_saving')
                  : t('userProfile_save')}
              </PixelButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
