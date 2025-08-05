import React from 'react';
import { Download } from 'lucide-react';
import { AssetVersion } from '~/types';
import { formatBytes } from '~/lib/utils';
import { sanitizeText } from '~/utils/sanitization';

export interface AssetVersionsProps {
  versions?: AssetVersion[];
}

export const AssetVersions = React.memo<AssetVersionsProps>(({ versions }) => {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-header p-4 border-b border-base-300">
        <h3 className="font-semibold text-lg">Version History</h3>
      </div>
      <div className="card-body">
        {versions && versions.length > 0 ? (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">Version {version.versionNumber}</p>
                  <p className="text-base-content/60 text-sm">
                    {formatBytes(version.fileSize)} •{' '}
                    {new Date(version.createdAt).toLocaleString()}
                  </p>
                  {version.changeLog && (
                    <p className="mt-1 text-sm">{sanitizeText(version.changeLog)}</p>
                  )}
                </div>
                <button className="btn btn-sm btn-ghost" aria-label={`Download version ${version.versionNumber}`}>
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base-content/60">No version history available</p>
        )}
      </div>
    </div>
  );
});

AssetVersions.displayName = 'AssetVersions';