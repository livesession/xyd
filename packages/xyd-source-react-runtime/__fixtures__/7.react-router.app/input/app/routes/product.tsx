import { useParams } from "react-router";

export default function ProductRoute() {
    const { productId } = useParams();
    return <div><h1>Product {productId}</h1></div>;
}
