import Shop from "./shop";
import Item from "./item"

export default interface Receipt {
    id: number;
    shop: Shop;
    items: Item[];
}