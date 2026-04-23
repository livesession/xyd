import { Link } from "react-router";
import type { Product } from "../types/product";

interface ProductCardProps {
    product: Product;
    onAddToCart: (productId: string) => void;
    layout?: "grid" | "list";
}

export function ProductCard({ product, onAddToCart, layout = "grid" }: ProductCardProps) {
    return (
        <div className={`product-card product-card--${layout}`}>
            <Link to={`/products/${product.id}`}>
                <h3>{product.name}</h3>
            </Link>
            <span>${product.price}</span>
            <button
                type="button"
                disabled={!product.inStock}
                onClick={() => onAddToCart(product.id)}
            >
                {product.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
        </div>
    );
}
