import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  CommunitySignalsSection,
  type CommunityPost,
  type CommunitySummary,
  type PostSource,
  type Sentiment,
} from '@/components/istanbulmedic-connect/profile/CommunitySignalsSection';

// Mock the social icons to avoid import issues
vi.mock('@/lib/social-icons', () => ({
  SOCIAL_LOGO_MAP: {
    reddit: 'R',
    instagram: 'I',
    google: 'G',
    facebook: 'F',
    youtube: 'Y',
    forums: 'Fo',
    other: 'O',
  },
  SOURCE_LABEL: {
    reddit: 'Reddit',
    instagram: 'Instagram',
    google: 'Google Reviews',
    facebook: 'Facebook',
    youtube: 'YouTube',
    forums: 'Forums',
    other: 'Web',
  },
}));

describe('CommunitySignalsSection', () => {
  const createPost = (overrides: Partial<CommunityPost> = {}): CommunityPost => ({
    source: 'reddit' as PostSource,
    author: 'hairlosswarrior',
    date: 'Jan 15, 2025',
    snippet: 'Had an amazing experience at this clinic. The results after 12 months are incredible.',
    url: 'https://reddit.com/r/hairtransplant/post1',
    ...overrides,
  });

  const createSummary = (overrides: Partial<CommunitySummary> = {}): CommunitySummary => ({
    totalMentions: 42,
    sentiment: 'Positive' as Sentiment,
    commonThemes: ['Great results', 'Professional staff', 'Affordable'],
    ...overrides,
  });

  it('renders section title', () => {
    render(<CommunitySignalsSection posts={[]} summary={createSummary()} />);
    expect(screen.getByText('Community Signals')).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<CommunitySignalsSection posts={[]} summary={createSummary()} />);
    expect(screen.getByText(/Mentions from social platforms/)).toBeInTheDocument();
  });

  it('renders total mentions count', () => {
    render(<CommunitySignalsSection posts={[]} summary={createSummary({ totalMentions: 42 })} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Mentions')).toBeInTheDocument();
  });

  it('renders sentiment badge', () => {
    render(<CommunitySignalsSection posts={[]} summary={createSummary({ sentiment: 'Positive' })} />);
    expect(screen.getByText('Positive')).toBeInTheDocument();
  });

  it('renders neutral sentiment', () => {
    render(<CommunitySignalsSection posts={[]} summary={createSummary({ sentiment: 'Neutral' })} />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('renders negative sentiment', () => {
    render(<CommunitySignalsSection posts={[]} summary={createSummary({ sentiment: 'Negative' })} />);
    expect(screen.getByText('Negative')).toBeInTheDocument();
  });

  it('renders common themes as badges', () => {
    render(<CommunitySignalsSection posts={[]} summary={createSummary({ commonThemes: ['Great results', 'Professional staff'] })} />);
    expect(screen.getByText('Great results')).toBeInTheDocument();
    expect(screen.getByText('Professional staff')).toBeInTheDocument();
  });

  it('renders post author', () => {
    const posts = [createPost({ author: 'happypatient123' })];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.getByText('happypatient123')).toBeInTheDocument();
  });

  it('renders post date', () => {
    const posts = [createPost({ date: 'Feb 20, 2025' })];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.getByText('Feb 20, 2025')).toBeInTheDocument();
  });

  it('renders post snippet', () => {
    const posts = [createPost({ snippet: 'This is my review of the clinic' })];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.getByText('This is my review of the clinic')).toBeInTheDocument();
  });

  it('renders source label for Reddit posts', () => {
    const posts = [createPost({ source: 'reddit' })];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.getByText('Reddit')).toBeInTheDocument();
  });

  it('renders multiple posts', () => {
    const posts = [
      createPost({ author: 'user1', snippet: 'First review' }),
      createPost({ author: 'user2', snippet: 'Second review' }),
    ];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('First review')).toBeInTheDocument();
    expect(screen.getByText('Second review')).toBeInTheDocument();
  });

  it('renders external link for post with URL', () => {
    const posts = [createPost({ url: 'https://reddit.com/post1' })];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    const link = screen.getByRole('link', { name: 'Open source' });
    expect(link).toHaveAttribute('href', 'https://reddit.com/post1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('does not render link when URL is #', () => {
    const posts = [createPost({ url: '#' })];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.queryByRole('link', { name: 'Open source' })).not.toBeInTheDocument();
  });

  it('renders All tab by default', () => {
    const posts = [createPost()];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument();
  });

  it('renders source-specific tabs based on posts', () => {
    const posts = [
      createPost({ source: 'reddit' }),
      createPost({ source: 'instagram' }),
    ];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.getByRole('tab', { name: /Reddit/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Instagram/i })).toBeInTheDocument();
  });

  it('shows expand button when more than 4 posts', () => {
    const posts = Array.from({ length: 6 }, (_, i) =>
      createPost({ author: `user${i}`, snippet: `Post ${i}` })
    );
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.getByText(/View all 6 mentions/)).toBeInTheDocument();
  });

  it('does not show expand button when 4 or fewer posts', () => {
    const posts = Array.from({ length: 4 }, (_, i) =>
      createPost({ author: `user${i}` })
    );
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);
    expect(screen.queryByText(/View all/)).not.toBeInTheDocument();
  });

  it('expands to show all posts when expand button clicked', () => {
    const posts = Array.from({ length: 6 }, (_, i) =>
      createPost({ author: `author${i}`, snippet: `Snippet ${i}` })
    );
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);

    // Initially only 4 posts visible
    expect(screen.queryByText('author4')).not.toBeInTheDocument();

    // Click expand
    fireEvent.click(screen.getByText(/View all 6 mentions/));

    // Now all posts visible
    expect(screen.getByText('author4')).toBeInTheDocument();
    expect(screen.getByText('author5')).toBeInTheDocument();
  });

  it('shows collapse button after expanding', () => {
    const posts = Array.from({ length: 6 }, (_, i) =>
      createPost({ author: `user${i}` })
    );
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);

    fireEvent.click(screen.getByText(/View all/));
    expect(screen.getByText(/Show less/)).toBeInTheDocument();
  });

  it('shows empty state when no posts for selected source', () => {
    const posts = [createPost({ source: 'reddit' })];
    render(<CommunitySignalsSection posts={posts} summary={createSummary()} />);

    // Instagram tab shouldn't exist since no Instagram posts
    expect(screen.queryByRole('tab', { name: /Instagram/i })).not.toBeInTheDocument();
  });
});
