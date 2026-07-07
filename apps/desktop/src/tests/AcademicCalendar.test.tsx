import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AcademicCalendar from '@/components/academic/AcademicCalendar';
import { SidebarContentProvider } from '@/context/sidebar-content-context';
import { format, startOfMonth, addMonths, subMonths } from 'date-fns';

// Mock Sidebar content context
const setSidebarContent = vi.fn();
vi.mock('@/context/sidebar-content-context', () => ({
  useSidebarContent: () => ({
    setSidebarContent,
  }),
  SidebarContentProvider: ({ children }: any) => <div>{children}</div>,
}));

describe('AcademicCalendar', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Math Exam',
      _type: 'Exam',
      _date: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'History Assignment',
      _type: 'Assignment',
      _date: new Date().toISOString(),
    },
  ];

  const renderCalendar = (events = mockEvents) => {
    return render(
      <SidebarContentProvider>
        <AcademicCalendar events={events} onSelectEvent={vi.fn()} />
      </SidebarContentProvider>
    );
  };

  it('renders without crashing', () => {
    renderCalendar();
    expect(screen.getByText(format(new Date(), 'MMMM yyyy'), { selector: 'h2' })).toBeInTheDocument();
  });

  it('displays events in month view', () => {
    renderCalendar();
    expect(screen.getByText('Math Exam')).toBeInTheDocument();
    expect(screen.getByText('History Assignment')).toBeInTheDocument();
  });

  it('switches views correctly', () => {
    renderCalendar();
    const viewButtons = screen.getAllByRole('button');
    const dayButton = viewButtons.find(b => b.textContent === 'day')!;
    fireEvent.click(dayButton);
    expect(screen.getByText(format(new Date(), 'MMMM d, yyyy'))).toBeInTheDocument();

    const weekButton = viewButtons.find(b => b.textContent === 'week')!;
    fireEvent.click(weekButton);
    // Week view shows date range in header
    expect(screen.getByText(/ - /)).toBeInTheDocument();
  });

  it('navigates to previous and next month', () => {
    renderCalendar();

    const todayButton = screen.getByRole('button', { name: /Today/i });
    const navContainer = todayButton.parentElement!;
    const buttons = within(navContainer).getAllByRole('button');

    const backButton = buttons[0];
    const nextButton = buttons[2];

    fireEvent.click(nextButton);
    const nextMonth = addMonths(startOfMonth(new Date()), 1);
    expect(screen.getByText(format(nextMonth, 'MMMM yyyy'), { selector: 'h2' })).toBeInTheDocument();

    fireEvent.click(backButton); // Back to current
    fireEvent.click(backButton); // To previous
    const prevMonth = subMonths(startOfMonth(new Date()), 1);
    expect(screen.getByText(format(prevMonth, 'MMMM yyyy'), { selector: 'h2' })).toBeInTheDocument();
  });

  it('handles empty events gracefully', () => {
    renderCalendar([]);
    expect(screen.getByText(format(new Date(), 'MMMM yyyy'), { selector: 'h2' })).toBeInTheDocument();
    // No events should be visible
    expect(screen.queryByText('Math Exam')).not.toBeInTheDocument();
  });
});
