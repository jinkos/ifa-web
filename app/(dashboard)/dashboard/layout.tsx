'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { href: '/dashboard/clients', label: 'Clients' },
    { href: '/dashboard/documents', label: 'Documents' },
    { href: '/dashboard/summary', label: 'Summary' },
    { href: '/dashboard/planning', label: 'Planning' },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-68px)] max-w-7xl mx-auto w-full">
      {/* Top horizontal menu */}
      <nav className="w-full border-b bg-white dark:bg-black">
        <ul className="flex flex-row justify-start items-center gap-2 px-4 py-2 overflow-x-auto">
          {tabs.map((t) => {
            const active = pathname?.startsWith(t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={[
                    'px-4 py-2 rounded-t-md font-medium whitespace-nowrap transition-colors duration-150',
                    active
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-0 lg:p-4">{children}</main>
    </div>
  );
}
