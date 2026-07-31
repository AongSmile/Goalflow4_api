export interface CartItemDto {
  id: number;
  count: number;
  price: number;
}

export interface UserCartDto {
  cart: CartItemDto[];
}

export interface SaveAddressDto {
  address: string;
}

export interface PaymentIntentInfo {
  id: string;
  amount: number;
  status: string;
  currency: string;
}

export interface SaveOrderDto {
  paymentIntent: PaymentIntentInfo;
}
