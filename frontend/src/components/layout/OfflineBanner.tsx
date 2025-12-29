'use client';

import { useAppStore } from '@/store';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
    const { isOfflineBannerVisible } = useAppStore();

    if (!isOfflineBannerVisible) return null;

    return (
        <div className="offline-banner">
            <WifiOff size={16} style={{ display: 'inline', marginRight: 8 }} />
            Você está offline. Algumas funcionalidades podem não estar disponíveis.
        </div>
    );
}
