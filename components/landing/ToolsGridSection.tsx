'use client';

import { Calendar, MessageCircle, CreditCard, Headphones } from 'lucide-react';
import Section from '@/components/ui/section';
import Container from '@/components/ui/container';

const tools = [
    {
        icon: Calendar,
        title: 'Manage appointments',
        description: 'Stay organized with clear details for every consultation and procedure.',
    },
    {
        icon: MessageCircle,
        title: 'Message with patients',
        description: 'Sync schedules, coordinate arrivals, and answer questions in real time.',
    },
    {
        icon: CreditCard,
        title: 'Get paid securely',
        description: 'Receive payments securely and see your earnings in real time.',
    },
    {
        icon: Headphones,
        title: '24/7 concierge support',
        description: 'Dedicated assistance via WhatsApp from first inquiry to full recovery.',
    },
];

export default function ToolsGridSection() {
    return (
        <Section className="py-16 sm:py-24">
            <Container>
                <div className="mb-12 max-w-2xl">
                    <h2 className="im-heading-2 mb-4 text-left text-im-text-primary">
                        World-class tools for your care journey
                    </h2>
                    <p className="im-text-body im-text-muted text-left">
                        Your consultations, appointments, messages, and support—all coordinated for you.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                        <div
                            key={tool.title}
                            className="flex flex-col rounded-xl border border-border bg-card p-6"
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-im-primary/10 text-im-primary">
                                <Icon className="h-6 w-6" />
                            </div>
                            <h3 className="im-heading-5 mb-2 text-im-text-primary">
                                {tool.title}
                            </h3>
                            <p className="im-text-body-sm im-text-muted flex-1">
                                {tool.description}
                            </p>
                        </div>
                        );
                    })}
                </div>
            </Container>
        </Section>
    );
}
