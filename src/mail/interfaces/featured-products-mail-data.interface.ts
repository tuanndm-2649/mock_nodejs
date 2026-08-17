export interface FeaturedProductsItem {
  name: string;
  price: number;
}

export interface FeaturedProductsMailData {
  email: string;
  products: FeaturedProductsItem[];
}
