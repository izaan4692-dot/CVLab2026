export interface PaymentFormData {
  fullName: string;
  email: string;
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  saveCard: boolean;
}

export interface OptimizationFeature {
  icon: any;
  label: string;
  checked: boolean;
}

export interface OrderDetails {
  originalPrice: number;
  discountedPrice: number;
  features: OptimizationFeature[];
}

