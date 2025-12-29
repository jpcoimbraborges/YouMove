'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Dumbbell,
    CalendarDays,
    BarChart3,
    UserCircle2,
    Utensils,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Início' },
    { href: '/workout', icon: Dumbbell, label: 'Treino' },
    { href: '/nutrition', icon: Utensils, label: 'Nutrição' },
    { href: '/recipes', icon: Utensils, label: 'Receitas' },
    { href: '/history', icon: CalendarDays, label: 'Agenda' },
    { href: '/progress', icon: BarChart3, label: 'Progresso' },
    { href: '/profile', icon: UserCircle2, label: 'Perfil' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside
            className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 flex-col border-r border-white/10 z-50"
            style={{
                background: 'rgba(11, 14, 20, 0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white">
                    <Image
                        src="/youmove-logo.png"
                        alt="YouMove"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white">YouMove</h1>
                    <p className="text-xs text-gray-500">AI Fitness</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                ? 'text-white'
                                : 'text-[#6B7280] hover:text-gray-300 hover:bg-white/5'
                                }`}
                            style={
                                isActive
                                    ? {
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        borderLeft: '4px solid #3B82F6'
                                    }
                                    : { borderLeft: '4px solid transparent' }
                            }
                        >
                            {/* Icon with Glow */}
                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={`transition-all duration-300 ${isActive ? 'text-[#3B82F6] scale-110' : ''
                                    }`}
                                style={
                                    isActive
                                        ? {
                                            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
                                        }
                                        : {}
                                }
                            />

                            {/* Label */}
                            <span
                                className={`text-sm font-medium transition-all duration-300 ${isActive ? 'font-semibold' : ''
                                    }`}
                            >
                                {item.label}
                            </span>

                            {/* Active Indicator Glow */}
                            {isActive && (
                                <div
                                    className="absolute right-3 w-2 h-2 rounded-full animate-pulse"
                                    style={{
                                        background: '#3B82F6',
                                        boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)'
                                    }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>Sistema Ativo</span>
                </div>
            </div>
        </aside>
    );
}
