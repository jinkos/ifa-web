
    export const IconNotepad = ({ filled }: { filled: boolean }) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={filled ? 'transform translate-y-0 shadow-md' : ''}>
            <rect x="4" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" fill={filled ? 'currentColor' : 'none'} />
            <path d="M8 7h6" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M8 11h6" stroke={filled ? '#fff' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    );