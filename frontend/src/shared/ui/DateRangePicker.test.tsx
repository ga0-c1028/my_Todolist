import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePicker } from './DateRangePicker';

afterEach(cleanup);

describe('DateRangePicker', () => {
  it('popover is closed initially', () => {
    render(<DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} />);
    expect(screen.queryByText('일')).not.toBeInTheDocument();
  });

  it('opens popover when a trigger button is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker startDate={null} endDate={null} onChange={vi.fn()} />);
    await user.click(screen.getByText(/시작일자/));
    expect(screen.getByText('일')).toBeInTheDocument();
  });

  it('clicking a day with no start/end calls onChange with that day as startDate', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateRangePicker startDate="2026-01-10" endDate={null} onChange={onChange} />);
    await user.click(screen.getByText(/시작일자/));
    await user.click(screen.getByText('5'));
    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-01-05', endDate: null });
  });

  it('clicking a day on/after start with start set and no end completes the range and closes popover', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateRangePicker startDate="2026-01-10" endDate={null} onChange={onChange} />);
    await user.click(screen.getByText(/시작일자/));
    await user.click(screen.getByText('15'));
    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-01-10', endDate: '2026-01-15' });
    expect(screen.queryByText('일')).not.toBeInTheDocument();
  });

  it('clicking a day before start replaces start and keeps popover open', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateRangePicker startDate="2026-01-10" endDate={null} onChange={onChange} />);
    await user.click(screen.getByText(/시작일자/));
    await user.click(screen.getByText('5'));
    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-01-05', endDate: null });
    expect(screen.getByText('일')).toBeInTheDocument();
  });

  it('clicking a day with a complete range starts a new selection', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateRangePicker startDate="2026-01-10" endDate="2026-01-15" onChange={onChange} />);
    await user.click(screen.getByText(/시작일자/));
    await user.click(screen.getByText('20'));
    expect(onChange).toHaveBeenCalledWith({ startDate: '2026-01-20', endDate: null });
  });

  it('advances displayed month when clicking next month nav', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker startDate="2026-01-10" endDate={null} onChange={vi.fn()} />);
    await user.click(screen.getByText(/시작일자/));
    expect(screen.getByText('2026년 1월')).toBeInTheDocument();
    await user.click(screen.getByLabelText('다음 달'));
    expect(screen.getByText('2026년 2월')).toBeInTheDocument();
  });

  it('applies the in-range class to a day between start and end', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker startDate="2026-01-10" endDate="2026-01-15" onChange={vi.fn()} />);
    await user.click(screen.getByText(/시작일자/));
    expect(screen.getByText('12')).toHaveClass('date-range-picker__cell--in-range');
  });
});
