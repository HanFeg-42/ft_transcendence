import { useState, useEffect } from 'react';
import Card from './Card';
import PixelButton from './PixelButton';
import type { ProfileData } from '../../services/userService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData | null;
  onSave: (data: { username?: string; bio?: string; avatar?: string }) => Promise<void>;
}

export default function EditProfileModal({ isOpen, onClose, profile, onSave }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remplir les champs quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && profile) {
      setDisplayName(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
      setError(null);
    }
  }, [isOpen, profile]);

  // Fermer avec Échap
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
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
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
        <Card variant="green" className="p-6 bg-pacova-surface">
          <h2 className="font-pixelify text-2xl text-pacova-green uppercase tracking-widest mb-6 text-center">
            ▼ EDIT PROFILE
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="font-pixelify text-sm text-pacova-green uppercase tracking-wider block mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                className="w-full bg-black/60 border border-pacova-green/40 rounded px-4 py-2 
                          font-vt323 text-lg text-white focus:outline-none focus:border-pacova-green"
                placeholder="Your name"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label className="font-pixelify text-sm text-pacova-green uppercase tracking-wider block mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-black/60 border border-pacova-green/40 rounded px-4 py-2 
                          font-vt323 text-lg text-white focus:outline-none focus:border-pacova-green"
                placeholder="https://..."
              />
            </div>

            {/* Bio */}
            <div>
              <label className="font-pixelify text-sm text-pacova-green uppercase tracking-wider block mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full bg-black/60 border border-pacova-green/40 rounded px-4 py-2 
                          font-vt323 text-lg text-white focus:outline-none focus:border-pacova-green resize-none"
                placeholder="Tell us about yourself..."
              />
              <span className="font-vt323 text-xs text-gray-400 block text-right mt-1">
                {bio.length}/200
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded px-4 py-2">
                <p className="font-vt323 text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <PixelButton
                type="button"
                variant="olive-yellow"
                size="sm"
                onClick={onClose}
                className="flex-1"
                disabled={saving}
              >
                CANCEL
              </PixelButton>
              <PixelButton
                type="submit"
                variant="olive-yellow"
                size="sm"
                className="flex-1"
                disabled={saving}
              >
                {saving ? 'SAVING...' : 'SAVE'}
              </PixelButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}