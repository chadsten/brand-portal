import React from 'react';
import { AssetActivity as AssetActivityType } from '~/types';
import { formatDistanceToNow } from '~/lib/utils';
import { sanitizeUserName, sanitizeText } from '~/utils/sanitization';

export interface AssetActivityProps {
  activity: AssetActivityType[];
}

export const AssetActivity = React.memo<AssetActivityProps>(({ activity }) => {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-header p-4 border-b border-base-300">
        <h3 className="font-semibold text-lg">Recent Activity</h3>
      </div>
      <div className="card-body">
        {activity && activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="avatar">
                  <div className="w-8 rounded-full">
                    {item.user?.image ? (
                      <img 
                        src={item.user.image} 
                        alt={sanitizeUserName(item.user.name)}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-base-300">
                        <span className="text-base-content text-sm font-medium">
                          {sanitizeUserName(item.user?.name)?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{sanitizeUserName(item.user?.name)}</span>{' '}
                    {sanitizeText(item.action)}
                  </p>
                  <p className="text-base-content/60 text-xs">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base-content/60">No activity recorded</p>
        )}
      </div>
    </div>
  );
});

AssetActivity.displayName = 'AssetActivity';