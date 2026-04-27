import { Link } from "react-router";
import type { CartItem } from "../types/product";

interface CartRouteProps {
    items: CartItem[];
    onRemove: (productId: string) => void;
}

export default function CartRoute() {
    return (
        <div>
            <h1>Cart</h1>
            <Link to="/">Continue Shopping</Link>
        </div>
    );
}
