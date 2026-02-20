export const quickPrompts = [
    'Schedule a free consultation',
    'What is a hair transplant?',
    'How much does it cost?',
    'What is the recovery time?',
];

export const WHATSAPP_NUMBER = '++447728289170';
export const WHATSAPP_DEEP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/^\+/, '')}`;
export const CONSULTATION_LINK =
    'https://cal.com/team/istanbul-medic/istanbul-medic-15-minutes-consultation';

const defaultChatServiceBaseUrl =
    process.env.NODE_ENV === 'production'
        ? 'https://whats-app-agent-j8e221x72-whatsapp-bot.vercel.app'
        : 'http://localhost:8000';

export const REST_BASE_URL =
    process.env.NEXT_PUBLIC_CHAT_SERVICE_BASE_URL || defaultChatServiceBaseUrl;

export const FOOTER_ROUTES = [
    '/',
    '/solutions',
    '/hospitals',
    '/why',
    '/price',
    '/articles',
    '/faq',
    '/team',
];
