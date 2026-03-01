import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExploreClinicsPage } from '@/components/istanbulmedic-connect/ExploreClinicsPage';
import type { Clinic, FilterState } from '@/components/istanbulmedic-connect/types';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/clinics',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock the Google Font
vi.mock('next/font/google', () => ({
  Merriweather: () => ({
    className: 'mocked-merriweather',
  }),
}));

describe('ExploreClinicsPage', () => {
  const defaultFilters: FilterState = {
    searchQuery: '',
    location: '',
    treatments: {
      'Hair Transplant': false,
      Dental: false,
      'Cosmetic Surgery': false,
      'Eye Surgery': false,
      'Bariatric Surgery': false,
    },
    budgetRange: [0, 50000],
    languages: {
      English: false,
      Turkish: false,
      Arabic: false,
      German: false,
    },
    accreditations: {
      JCI: false,
      ISO: false,
      'Ministry Licensed': false,
    },
    aiMatchScore: 0,
    minRating: null,
    minReviews: null,
  };

  const sampleClinics: Clinic[] = [
    {
      id: 'clinic-1',
      name: 'Istanbul Hair Clinic',
      location: 'Istanbul, Turkey',
      image: 'https://example.com/clinic1.jpg',
      specialties: ['Hair Transplant'],
      languages: ['English', 'Turkish'],
      accreditations: ['JCI'],
      trustScore: 90,
      description: 'Top rated hair clinic',
      rating: 4.8,
    },
    {
      id: 'clinic-2',
      name: 'Dental Center Ankara',
      location: 'Ankara, Turkey',
      image: 'https://example.com/clinic2.jpg',
      specialties: ['Dental'],
      languages: ['English', 'German'],
      accreditations: ['ISO'],
      trustScore: 85,
      description: 'Premier dental center',
      rating: 4.5,
    },
  ];

  const defaultProps = {
    initialClinics: sampleClinics,
    totalCount: 2,
    page: 1,
    pageSize: 12,
    initialFilters: defaultFilters,
    initialSort: 'Best Match' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders page headline', () => {
      render(<ExploreClinicsPage {...defaultProps} />);
      expect(screen.getByText(/Connect with a Trusted Hair Transplant Clinic/)).toBeInTheDocument();
    });

    it('renders total count header', () => {
      render(<ExploreClinicsPage {...defaultProps} />);
      expect(screen.getByText('2 clinics available')).toBeInTheDocument();
    });

    it('renders range display correctly', () => {
      render(<ExploreClinicsPage {...defaultProps} />);
      expect(screen.getByText('Showing 1-2 of 2')).toBeInTheDocument();
    });

    it('renders clinic cards', () => {
      render(<ExploreClinicsPage {...defaultProps} />);
      expect(screen.getByText('Istanbul Hair Clinic')).toBeInTheDocument();
      expect(screen.getByText('Dental Center Ankara')).toBeInTheDocument();
    });

    it('renders sort dropdown with default value', () => {
      render(<ExploreClinicsPage {...defaultProps} />);
      expect(screen.getByLabelText('Sort clinics')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no clinics', () => {
      render(<ExploreClinicsPage {...defaultProps} initialClinics={[]} totalCount={0} />);
      expect(screen.getByText('No clinics found')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
    });

    it('shows clear filters button in empty state', () => {
      render(<ExploreClinicsPage {...defaultProps} initialClinics={[]} totalCount={0} />);
      expect(screen.getByRole('button', { name: /Clear all filters/i })).toBeInTheDocument();
    });

    it('shows 0 in range when no results', () => {
      render(<ExploreClinicsPage {...defaultProps} initialClinics={[]} totalCount={0} />);
      expect(screen.getByText('Showing 0-0 of 0')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('does not show pagination when only one page', () => {
      render(<ExploreClinicsPage {...defaultProps} />);
      expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
    });

    it('shows pagination when multiple pages', () => {
      render(<ExploreClinicsPage {...defaultProps} totalCount={50} />);
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
    });

    it('disables Previous button on first page', () => {
      render(<ExploreClinicsPage {...defaultProps} totalCount={50} />);
      expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();
    });

    it('enables Next button when more pages available', () => {
      render(<ExploreClinicsPage {...defaultProps} totalCount={50} />);
      expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();
    });

    it('disables Next button on last page', () => {
      render(<ExploreClinicsPage {...defaultProps} totalCount={50} page={5} />);
      // pageSize is 12, so 50/12 = ~4.17 = 5 pages
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
    });

    it('navigates to next page when Next clicked', async () => {
      render(<ExploreClinicsPage {...defaultProps} totalCount={50} />);

      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/clinics?page=2');
      });
    });

    it('navigates to previous page when Previous clicked', async () => {
      render(<ExploreClinicsPage {...defaultProps} totalCount={50} page={3} />);

      fireEvent.click(screen.getByRole('button', { name: /Previous/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/clinics?page=2');
      });
    });

    it('calculates page count correctly', () => {
      // 25 total / 12 per page = 3 pages (rounded up)
      render(<ExploreClinicsPage {...defaultProps} totalCount={25} />);
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('updates URL when sort changes', async () => {
      render(<ExploreClinicsPage {...defaultProps} />);

      // Open the select dropdown
      const sortTrigger = screen.getByLabelText('Sort clinics');
      fireEvent.click(sortTrigger);

      // Select "Highest Rated"
      const highestRatedOption = screen.getByText('Highest Rated');
      fireEvent.click(highestRatedOption);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/clinics?sort=Highest+Rated');
      });
    });
  });

  describe('Range Display', () => {
    it('displays correct range for page 2', () => {
      render(<ExploreClinicsPage {...defaultProps} page={2} totalCount={30} pageSize={12} />);
      // Page 2: items 13-24
      expect(screen.getByText('Showing 13-24 of 30')).toBeInTheDocument();
    });

    it('displays correct range for last partial page', () => {
      render(<ExploreClinicsPage {...defaultProps} page={3} totalCount={30} pageSize={12} />);
      // Page 3: items 25-30 (only 6 items)
      expect(screen.getByText('Showing 25-30 of 30')).toBeInTheDocument();
    });
  });

  describe('Clinic Navigation', () => {
    it('navigates to clinic detail page when card clicked', async () => {
      render(<ExploreClinicsPage {...defaultProps} />);

      // Find the clinic card and click it
      const clinicName = screen.getByText('Istanbul Hair Clinic');
      const card = clinicName.closest('[class*="cursor-pointer"]');

      if (card) {
        fireEvent.click(card);

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/clinics/clinic-1');
        });
      }
    });
  });

  describe('Filter Integration', () => {
    it('includes search query in URL when present', async () => {
      const filtersWithSearch = {
        ...defaultFilters,
        searchQuery: 'hair',
      };

      render(<ExploreClinicsPage {...defaultProps} initialFilters={filtersWithSearch} />);

      // The filter change should trigger URL update after debounce
      // Since we're starting with a search query, clicking next should include it
      // First render with the filters, then trigger pagination
      render(<ExploreClinicsPage {...defaultProps} totalCount={50} initialFilters={filtersWithSearch} />);

      fireEvent.click(screen.getAllByRole('button', { name: /Next/i })[0]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=hair'));
      });
    });

    it('includes treatments in URL when selected', async () => {
      const filtersWithTreatments = {
        ...defaultFilters,
        treatments: {
          ...defaultFilters.treatments,
          'Hair Transplant': true,
        },
      };

      render(<ExploreClinicsPage {...defaultProps} totalCount={50} initialFilters={filtersWithTreatments} />);

      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('treatments=Hair+Transplant'));
      });
    });
  });
});
