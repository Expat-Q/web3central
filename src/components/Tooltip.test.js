import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Tooltip from './Tooltip';

describe('Tooltip Component', () => {
  test('renders children correctly', () => {
    render(
      <Tooltip content="This is a tooltip">
        <span>Hover me</span>
      </Tooltip>
    );
    
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  test('shows tooltip on hover', () => {
    render(
      <Tooltip content="This is a tooltip">
        <span data-testid="tooltip-trigger">Hover me</span>
      </Tooltip>
    );
    
    const trigger = screen.getByTestId('tooltip-trigger');
    fireEvent.mouseEnter(trigger);
    
    expect(screen.getByText('This is a tooltip')).toBeInTheDocument();
  });

  test('hides tooltip on mouse leave', () => {
    jest.useFakeTimers();
    
    render(
      <Tooltip content="This is a tooltip">
        <span data-testid="tooltip-trigger">Hover me</span>
      </Tooltip>
    );
    
    const trigger = screen.getByTestId('tooltip-trigger');
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    
    // Tooltip should hide after a short delay
    jest.advanceTimersByTime(100);
    
    // Since we're not actually implementing delay in our simple component,
    // we'll just verify the component renders without errors
    expect(screen.queryByText('This is a tooltip')).not.toBeInTheDocument();
  });
});