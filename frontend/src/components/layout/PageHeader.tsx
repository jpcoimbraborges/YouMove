'use client';

import React, { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    action?: ReactNode;
}

export function PageHeader({ title, subtitle, showBack = false, action }: PageHeaderProps) {
    const router = useRouter();

    return (
        <header className="page-header">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {showBack && (
                        <button
                            onClick={() => router.back()}
                            className="btn-ghost btn-icon"
                            style={{ width: 40, height: 40, minHeight: 40 }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <div>
                        <h1 className="page-title">{title}</h1>
                        {subtitle && <p className="page-subtitle">{subtitle}</p>}
                    </div>
                </div>
                {action && <div>{action}</div>}
            </div>
        </header>
    );
}
