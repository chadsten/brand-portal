import { useState, useCallback } from 'react';
import { api } from '~/trpc/react';
import { sanitizeAssetTitle, sanitizeAssetDescription, sanitizeTags } from '~/utils/sanitization';

export interface UseAssetEditProps {
  assetId: string;
  initialTitle: string;
  initialDescription?: string;
  initialTags?: string[];
  onSuccess?: () => void;
}

export function useAssetEdit({
  assetId,
  initialTitle,
  initialDescription,
  initialTags,
  onSuccess
}: UseAssetEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const updateAssetMutation = api.asset.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      onSuccess?.();
    },
  });

  const handleStartEdit = useCallback(() => {
    setEditedTitle(sanitizeAssetTitle(initialTitle));
    setEditedDescription(sanitizeAssetDescription(initialDescription));
    setEditedTags(sanitizeTags(Array.isArray(initialTags) ? initialTags : []));
    setIsEditing(true);
  }, [initialTitle, initialDescription, initialTags]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedDescription('');
    setEditedTags([]);
    setNewTag('');
  }, []);

  const handleSave = useCallback(() => {
    updateAssetMutation.mutate({
      id: assetId,
      title: sanitizeAssetTitle(editedTitle),
      description: sanitizeAssetDescription(editedDescription),
      tags: sanitizeTags(editedTags),
    });
  }, [assetId, editedTitle, editedDescription, editedTags, updateAssetMutation]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !editedTags.includes(trimmedTag)) {
      setEditedTags([...editedTags, trimmedTag]);
      setNewTag('');
    }
  }, [newTag, editedTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  }, [editedTags]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  return {
    isEditing,
    editedTitle,
    editedDescription,
    editedTags,
    newTag,
    isLoading: updateAssetMutation.isPending,
    error: updateAssetMutation.error,
    setEditedTitle,
    setEditedDescription,
    setNewTag,
    handleStartEdit,
    handleCancelEdit,
    handleSave,
    handleAddTag,
    handleRemoveTag,
    handleTagKeyDown,
  };
}