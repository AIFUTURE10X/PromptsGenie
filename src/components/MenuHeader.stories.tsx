import type { Meta, StoryObj } from '@storybook/react';
import { fn , within, userEvent, expect } from '@storybook/test';

import MenuHeader from './MenuHeader';

const meta = {
  title: 'Components/MenuHeader',
  component: MenuHeader,
  parameters: {
    layout: 'fullwidth',
    docs: {
      description: {
        component: 'Navigation header with menu items for templates, settings, and about.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onTemplatesClick: { action: 'templates clicked' },
    onSettingsClick: { action: 'settings clicked' },
    onAboutClick: { action: 'about clicked' },
  },
  args: {
    onTemplatesClick: fn(),
    onSettingsClick: fn(),
    onAboutClick: fn(),
  },
} satisfies Meta<typeof MenuHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithInteractions: Story = {
  args: {},
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Test clicking on Templates
    const templatesButton = canvas.getByText('Templates');
    await userEvent.click(templatesButton);
    await expect(args.onTemplatesClick).toHaveBeenCalled();
    
    // Test clicking on Settings
    const settingsButton = canvas.getByText('Settings');
    await userEvent.click(settingsButton);
    await expect(args.onSettingsClick).toHaveBeenCalled();
    
    // Test clicking on About
    const aboutButton = canvas.getByText('About');
    await userEvent.click(aboutButton);
    await expect(args.onAboutClick).toHaveBeenCalled();
  },
};

export const MobileView: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'MenuHeader displayed on mobile viewport.',
      },
    },
  },
};

export const TabletView: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'MenuHeader displayed on tablet viewport.',
      },
    },
  },
};

export const WithoutCallbacks: Story = {
  args: {
    onTemplatesClick: undefined,
    onSettingsClick: undefined,
    onAboutClick: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'MenuHeader without any click handlers (buttons should still be clickable but do nothing).',
      },
    },
  },
};