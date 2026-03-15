import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostsSection } from '@/components/istanbulmedic-connect/profile/instagram/PostsSection';
import type { InstagramPostVM } from '@/components/istanbulmedic-connect/types';

const createMockPost = (overrides: Partial<InstagramPostVM> = {}): InstagramPostVM => {
  const base: InstagramPostVM = {
    id: 'post-1',
    type: 'Image',
    shortCode: 'ABC123',
    url: 'https://instagram.com/p/ABC123',
    caption: 'Test post caption',
    hashtags: ['test'],
    likesCount: 150,
    commentsCount: 12,
    timestamp: '2026-02-15T10:00:00Z',
  };
  return { ...base, ...overrides };
};

describe('PostsSection', () => {
  it('returns null when posts is undefined', () => {
    const { container } = render(<PostsSection />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when posts array is empty', () => {
    const { container } = render(<PostsSection posts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders section title', () => {
    render(<PostsSection posts={[createMockPost()]} />);
    expect(screen.getByText('Recent Posts')).toBeInTheDocument();
  });

  it('renders section description', () => {
    render(<PostsSection posts={[createMockPost()]} />);
    expect(screen.getByText(/Sample of recent Instagram posts/)).toBeInTheDocument();
  });

  it('renders up to 6 posts', () => {
    const posts = Array.from({ length: 10 }, (_, i) =>
      createMockPost({ id: `post-${i}`, shortCode: `CODE${i}` })
    );
    render(<PostsSection posts={posts} />);

    const links = screen.getAllByRole('link', { name: /Instagram post|Test post/i });
    // 6 post links + potentially "View all posts" link
    expect(links.filter(l => l.getAttribute('href')?.includes('instagram.com/p/'))).toHaveLength(6);
  });

  it('displays likes count', () => {
    render(<PostsSection posts={[createMockPost({ likesCount: 1500 })]} />);
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('displays comments count', () => {
    render(<PostsSection posts={[createMockPost({ commentsCount: 45 })]} />);
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('displays 0 for zero likes', () => {
    render(<PostsSection posts={[createMockPost({ likesCount: 0 })]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('displays 0 for zero comments', () => {
    render(<PostsSection posts={[createMockPost({ likesCount: 100, commentsCount: 0 })]} />);
    // Should show "0" for comments (likesCount shows "100")
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('displays "—" when likes are undefined (hidden)', () => {
    render(<PostsSection posts={[createMockPost({ likesCount: undefined, commentsCount: 5 })]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays "—" when comments are undefined (hidden)', () => {
    render(<PostsSection posts={[createMockPost({ likesCount: 100, commentsCount: undefined })]} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows "View all posts" link when username provided', () => {
    render(<PostsSection posts={[createMockPost()]} username="testclinic" />);
    const link = screen.getByRole('link', { name: /View all posts on Instagram/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://instagram.com/testclinic');
  });

  it('does not show "View all posts" link when username not provided', () => {
    render(<PostsSection posts={[createMockPost()]} />);
    expect(screen.queryByText(/View all posts on Instagram/i)).not.toBeInTheDocument();
  });

  it('links to correct Instagram post URL', () => {
    render(<PostsSection posts={[createMockPost({ url: 'https://instagram.com/p/XYZ789' })]} />);
    const postLink = screen.getByRole('link', { name: /Instagram post|Test post/i });
    expect(postLink).toHaveAttribute('href', 'https://instagram.com/p/XYZ789');
  });

  it('opens links in new tab', () => {
    render(<PostsSection posts={[createMockPost()]} username="testclinic" />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
