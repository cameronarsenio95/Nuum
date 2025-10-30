import { useMemo, useCallback } from 'react';
import { usePlanLimits } from '../contexts/PlanLimitsContext';
import { useToast } from '../contexts/ToastContext';

interface WritePermissionResult {
  canWrite: boolean;
  canCreateCreator: boolean;
  canUploadContent: (fileSizeBytes: number) => boolean;
  canAddTeamMember: boolean;
  checkWritePermission: (action?: string) => boolean;
  showUpgradePrompt: () => void;
}

export function useWritePermission(): WritePermissionResult {
  const {
    freeAccountInfo,
    canCreateCreator: checkCreatorLimit,
    canUploadContent: checkStorageLimit,
    canAddTeamMember: checkTeamLimit
  } = usePlanLimits();
  const { showToast } = useToast();

  const canWrite = useMemo(() => {
    return !freeAccountInfo.isFrozen;
  }, [freeAccountInfo.isFrozen]);

  const showUpgradePrompt = useCallback(() => {
    if (freeAccountInfo.isFrozen) {
      showToast(
        'Your account is frozen. Upgrade to Standard plan to continue.',
        'error'
      );
    } else if (freeAccountInfo.isExpired) {
      showToast(
        'Your Free plan has expired. Upgrade to Standard plan to continue.',
        'error'
      );
    }
  }, [freeAccountInfo.isFrozen, freeAccountInfo.isExpired, showToast]);

  const checkWritePermission = useCallback((action?: string) => {
    if (freeAccountInfo.isFrozen) {
      const actionText = action || 'perform this action';
      showToast(
        `Account frozen. You cannot ${actionText}. Upgrade to unlock.`,
        'error'
      );
      return false;
    }
    return true;
  }, [freeAccountInfo.isFrozen, showToast]);

  const canCreateCreator = useCallback(() => {
    if (!canWrite) {
      checkWritePermission('create creators');
      return false;
    }
    return checkCreatorLimit();
  }, [canWrite, checkCreatorLimit, checkWritePermission]);

  const canUploadContent = useCallback((fileSizeBytes: number) => {
    if (!canWrite) {
      checkWritePermission('upload content');
      return false;
    }
    return checkStorageLimit(fileSizeBytes);
  }, [canWrite, checkStorageLimit, checkWritePermission]);

  const canAddTeamMember = useCallback(() => {
    if (!canWrite) {
      checkWritePermission('add team members');
      return false;
    }
    return checkTeamLimit();
  }, [canWrite, checkTeamLimit, checkWritePermission]);

  return {
    canWrite,
    canCreateCreator,
    canUploadContent,
    canAddTeamMember,
    checkWritePermission,
    showUpgradePrompt,
  };
}
