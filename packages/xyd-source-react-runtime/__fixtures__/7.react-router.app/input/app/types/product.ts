export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
}

export interface CartItem {
    product: Product;
    quantity: number;
}
