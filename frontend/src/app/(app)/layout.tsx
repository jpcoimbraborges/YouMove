'use client';

import { Sidebar, MobileBottomNav } from '@/components/layout';
import { OfflineBanner } from '@/components/layout/OfflineBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-container">
            <OfflineBanner />

            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="app-content lg:pl-60">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
}
