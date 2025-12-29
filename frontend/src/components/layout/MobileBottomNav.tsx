'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Dumbbell,
    Utensils,
    CalendarDays,
    BarChart3,
    UserCircle2,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Início' },
    { href: '/workout', icon: Dumbbell, label: 'Treino' },
    { href: '/nutrition', icon: Utensils, label: 'Nutrição' },
    { href: '/history', icon: CalendarDays, label: 'Agenda' },
    { href: '/progress', icon: BarChart3, label: 'Progresso' },
    { href: '/profile', icon: UserCircle2, label: 'Perfil' },
];

export function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
            style={{
                background: 'rgba(11, 14, 20, 0.9)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
        >
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] min-h-[56px] transition-all duration-300 active:scale-95"
                        >
                            {/* Top Indicator Dot */}
                            {isActive && (
                                <div
                                    className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-10 h-1 rounded-b-full"
                                    style={{
                                        background: '#3B82F6',
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.6)'
                                    }}
                                />
                            )}

                            {/* Icon Container */}
                            <div className={`transition-all duration-300 ${isActive ? 'scale-110' : ''}`}>
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`transition-colors duration-300`}
                                    style={{
                                        color: isActive ? '#3B82F6' : '#6B7280',
                                        filter: isActive
                                            ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))'
                                            : 'none'
                                    }}
                                />
                            </div>

                            {/* Label */}
                            <span
                                className="text-xs font-medium transition-all duration-300"
                                style={{
                                    color: isActive ? '#3B82F6' : '#6B7280',
                                    fontWeight: isActive ? 600 : 500
                                }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
