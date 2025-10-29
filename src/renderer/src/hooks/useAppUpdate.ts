import { useEffect, useState, useCallback } from "react";

interface UpdateStatus {
  version: string;
  releaseDate: string;
  isAvailable: boolean;
  downloaded: boolean;
  progress?: number;
}

interface UpdateInfo {
  version: string;
  releaseDate: string;
}

export function useAppUpdate() {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    version: "1.0.0",
    releaseDate: "",
    isAvailable: false,
    downloaded: false,
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    try {
      const result = await window.api.checkForUpdates();
      if (result.error) {
        setError(result.error);
      }
      // The status will be updated via event listeners
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check for updates"
      );
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Download update
  const downloadUpdate = useCallback(async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const result = await window.api.downloadUpdate();
      if (!result.success) {
        setError(result.error || result.message || "Failed to download update");
        setIsDownloading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download update"
      );
      setIsDownloading(false);
    }
  }, []);

  // Install update and restart
  const installUpdateAndRestart = useCallback(async () => {
    try {
      const result = await window.api.installUpdateAndRestart();
      if (!result.success) {
        setError(result.message || "Failed to install update");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to install update");
    }
  }, []);

  // Get current update status
  const refreshUpdateStatus = useCallback(async () => {
    try {
      const status = await window.api.getUpdateStatus();
      setUpdateStatus(status);
      setDownloadProgress(status.progress || 0);
    } catch (err) {
      console.error("Failed to get update status:", err);
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    // Refresh status on mount
    refreshUpdateStatus();

    // Set up event listeners
    const handleUpdateChecking = () => {
      setIsChecking(true);
      setError(null);
    };

    const handleUpdateAvailable = (_: unknown, data: UpdateInfo) => {
      setUpdateStatus(prev => ({
        ...prev,
        isAvailable: true,
        version: data.version,
        releaseDate: data.releaseDate,
      }));
      setIsChecking(false);
    };

    const handleUpdateNotAvailable = () => {
      setUpdateStatus(prev => ({
        ...prev,
        isAvailable: false,
      }));
      setIsChecking(false);
    };

    const handleUpdateError = (_: unknown, data: { message: string }) => {
      setError(data.message);
      setIsChecking(false);
      setIsDownloading(false);
    };

    const handleUpdateDownloadProgress = (
      _: unknown,
      data: { percent: number; transferred: number; total: number }
    ) => {
      setDownloadProgress(data.percent);
    };

    const handleUpdateDownloaded = (_: unknown, data: UpdateInfo) => {
      setUpdateStatus(prev => ({
        ...prev,
        downloaded: true,
        version: data.version,
        releaseDate: data.releaseDate,
      }));
      setDownloadProgress(100);
      setIsDownloading(false);
    };

    window.api.onUpdateChecking(handleUpdateChecking);
    window.api.onUpdateAvailable(handleUpdateAvailable);
    window.api.onUpdateNotAvailable(handleUpdateNotAvailable);
    window.api.onUpdateError(handleUpdateError);
    window.api.onUpdateDownloadProgress(handleUpdateDownloadProgress);
    window.api.onUpdateDownloaded(handleUpdateDownloaded);

    return () => {
      window.api.removeUpdateListeners();
    };
  }, [refreshUpdateStatus]);

  return {
    updateStatus,
    isChecking,
    isDownloading,
    downloadProgress,
    error,
    checkForUpdates,
    downloadUpdate,
    installUpdateAndRestart,
    refreshUpdateStatus,
  };
}
