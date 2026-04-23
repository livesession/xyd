import { useState } from "react";
import type { Product } from "../types/product";
import { ProductCard } from "../components/ProductCard";

const PRODUCTS: Product[] = [
    { id: "1", name: "Keyboard", price: 79, category: "peripherals", inStock: true },
    { id: "2", name: "Mouse", price: 49, category: "peripherals", inStock: true },
    { id: "3", name: "Monitor", price: 399, category: "displays", inStock: false },
];

export default function Home() {
    const [cart, setCart] = useState<string[]>([]);

    return (
        <div>
            <h1>Shop</h1>
            <p>{cart.length} items in cart</p>
            <div>
                {PRODUCTS.map(p => (
                    <ProductCard
                        key={p.id}
                        product={p}
                        onAddToCart={(id) => setCart(prev => [...prev, id])}
                    />
                ))}
            </div>
        </div>
    );
}
