export const COLORS = {
  background: '#F5F5F7',
  primaryText: '#1D1D1F',
  secondaryText: '#6E6E73',
  lightGray: '#E5E5EA',
  placeholder: '#C7C7CC',
  accent: '#FF3B30',
  black: '#000000',
  white: '#FFFFFF',
  darkGray: '#3A3A3C',
} as const;

export const PRICING = {
  originalPrice: 19,
  discountedPrice: 9,
  discount: 50,
} as const;

export const MESSAGES = {
  processing: {
    title: 'Finalizing your enhanced resume...',
    description:
      'Applying final touches and preparing your optimized resume with detailed recommendations and insights.',
    statusLabel: 'AI Optimization in Progress',
    proTip: 'Well-optimized resumes can increase interview chances by up to 70%.',
  },
  payment: {
    title: 'Complete Your Payment',
    description:
      'Your resume is ready for AI optimization. Complete payment to unlock professional analysis and improvements.',
    secureCheckout: 'Secure Checkout',
    securePayment: 'Secure payment powered by Stripe',
    noRecurring: 'No recurring charges — one-time payment only',
  },
} as const;

