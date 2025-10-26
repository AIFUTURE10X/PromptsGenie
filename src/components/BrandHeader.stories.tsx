import type { Meta, StoryObj } from '@storybook/react';

import BrandHeader from './BrandHeader';

const meta = {
  title: 'Components/BrandHeader',
  component: BrandHeader,
  parameters: {
    layout: 'fullwidth',
    docs: {
      description: {
        component: 'Brand header component displaying the application logo and title.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'Custom title text',
    },
    subtitle: {
      control: { type: 'text' },
      description: 'Subtitle text',
    },
    logoSrc: {
      control: { type: 'text' },
      description: 'Custom logo source path',
    },
  },
} satisfies Meta<typeof BrandHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomTitle: Story = {
  args: {
    title: 'Custom App Name',
  },
  parameters: {
    docs: {
      description: {
        story: 'BrandHeader with a custom title.',
      },
    },
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'PromptsGenie',
    subtitle: 'AI-Powered Prompt Generation',
  },
  parameters: {
    docs: {
      description: {
        story: 'BrandHeader with both title and subtitle.',
      },
    },
  },
};

export const WithCustomLogo: Story = {
  args: {
    title: 'PromptsGenie',
    logoSrc: '/logo-custom.png',
  },
  parameters: {
    docs: {
      description: {
        story: 'BrandHeader with a custom logo source.',
      },
    },
  },
};

export const FullCustomization: Story = {
  args: {
    title: 'My Custom App',
    subtitle: 'Powered by AI Technology',
    logoSrc: '/custom-brand-logo.svg',
  },
  parameters: {
    docs: {
      description: {
        story: 'BrandHeader with all customization options applied.',
      },
    },
  },
};

export const MobileView: Story = {
  args: {
    title: 'PromptsGenie',
    subtitle: 'AI-Powered Prompt Generation',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'BrandHeader displayed on mobile viewport.',
      },
    },
  },
};

export const TabletView: Story = {
  args: {
    title: 'PromptsGenie',
    subtitle: 'AI-Powered Prompt Generation',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'BrandHeader displayed on tablet viewport.',
      },
    },
  },
};