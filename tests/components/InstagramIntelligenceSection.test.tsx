import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstagramIntelligenceSection } from '@/components/istanbulmedic-connect/profile/InstagramIntelligenceSection';
import type { InstagramIntelligenceVM } from '@/components/istanbulmedic-connect/types';

// Mock the InstagramTabContent to simplify testing
vi.mock('@/components/istanbulmedic-connect/profile/instagram/InstagramTabContent', () => ({
  InstagramTabContent: ({ data }: { data?: InstagramIntelligenceVM | null }) => (
    <div data-testid="instagram-tab-content">
      {data ? (
        <>
          {data.username && <span>@{data.username}</span>}
          {data.followersCount && <span>{data.followersCount} followers</span>}
        </>
      ) : (
        <span>No Instagram data</span>
      )}
    </div>
  ),
}));

describe('InstagramIntelligenceSection', () => {
  const createInstagramData = (
    overrides: Partial<InstagramIntelligenceVM> = {}
  ): InstagramIntelligenceVM => ({
    profileUrl: 'https://instagram.com/clinicname',
    username: 'clinicname',
    fullName: 'Premium Hair Clinic',
    biography: 'Leading hair transplant clinic in Istanbul',
    followersCount: 25000,
    postsCount: 450,
    verified: true,
    isBusinessAccount: true,
    businessCategoryName: 'Medical & Health',
    ...overrides,
  });

  it('renders section title', () => {
    render(<InstagramIntelligenceSection />);
    expect(screen.getByText('Social Presence & Brand Signals')).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<InstagramIntelligenceSection />);
    expect(screen.getByText(/Signals from the clinic's social media profiles/)).toBeInTheDocument();
  });

  it('shows Instagram content', () => {
    render(<InstagramIntelligenceSection data={createInstagramData()} />);
    expect(screen.getByTestId('instagram-tab-content')).toBeInTheDocument();
  });

  it('passes data to Instagram tab content', () => {
    render(<InstagramIntelligenceSection data={createInstagramData({ username: 'testclinic' })} />);
    expect(screen.getByText('@testclinic')).toBeInTheDocument();
  });

  it('handles null data prop', () => {
    render(<InstagramIntelligenceSection data={null} />);
    expect(screen.getByText('No Instagram data')).toBeInTheDocument();
  });

  it('handles undefined data prop', () => {
    render(<InstagramIntelligenceSection />);
    expect(screen.getByText('No Instagram data')).toBeInTheDocument();
  });

  it('renders with follower count', () => {
    render(<InstagramIntelligenceSection data={createInstagramData({ followersCount: 50000 })} />);
    expect(screen.getByText('50000 followers')).toBeInTheDocument();
  });
});
