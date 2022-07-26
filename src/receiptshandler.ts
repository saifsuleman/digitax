import database from "./sqldatabase"
import Shop from "./shop"
import Item from "./item"
import Receipt from "./receipt"

export default class ReceiptsHandler {
    constructor() {
        database.query({
            query: "CREATE TABLE IF NOT EXISTS shops (id INT(10) PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL, owner VARCHAR(255) NOT NULL)"
        })
        database.query({
            query: "CREATE TABLE IF NOT EXISTS receipts (id INT(10) PRIMARY KEY AUTO_INCREMENT, user VARCHAR(255) NOT NULL, shop INT(10) NOT NULL)"
        })
        database.query({
            query: "CREATE TABLE IF NOT EXISTS items (id INT(10) PRIMARY KEY AUTO_INCREMENT, receipt INT(10) NOT NULL, name VARCHAR(255) NOT NULL, price FLOAT(10) NOT NULL)"
        })
    }

    async getShop(id: number): Promise<Shop | null> {
        return new Promise<Shop | null>(resolver => {
            database.query({
                query: "SELECT * FROM shops WHERE id = ?",
                params: [id],
                callback: results => {
                    if (!results.length) return resolver(null)
                    return resolver(results[0] as Shop)
                }
            })
        })
    }

    async getShops(user: string): Promise<Shop[]> {
        return new Promise<Shop[]>(resolver => {
            database.query({
                query: `SELECT * FROM shops WHERE owner = ?`,
                params: [user],
                callback: results => resolver(results as Shop[])
            })
        })
    }

    async registerShop(name: string, owner: string): Promise<Shop> {
        return new Promise<Shop>(resolver => {
            database.query({
                query: "INSERT INTO shops (name, owner) VALUES (?, ?)",
                params: [name, owner],
                callback: r => {
                    const id = r.insertId
                    return resolver({ id, name, owner })
                }
            })
        })
    }

    async addReceipt(user: string, shop: Shop, items: Item[]): Promise<Receipt> {
        return new Promise<Receipt>(resolver => {
            database.query({
                query: "INSERT INTO receipts (user, shop) VALUES (?, ?)",
                params: [user, shop.id],
                callback: results => {
                    const id = results.insertId
                    // TODO: batch query
                    for (const item of items) {
                        database.query({
                            query: "INSERT INTO items (receipt, name, price) VALUES (?, ?, ?)",
                            params: [id, item.name, item.price]
                        })
                    }
                    return resolver({ id, items, shop })
                }
            })
        })
    }

    async deleteReceipt(id: number): Promise<void> {
        database.query({
            query: "DELETE FROM receipts WHERE id = ?",
            params: [id]
        })

        database.query({
            query: "DELETE FROM items WHERE receipt = ?",
            params: [id]
        })
    }

    async getReceiptItems(receipt: string): Promise<Item[]> {
        return new Promise<Item[]>(resolver => {
            database.query({
                query: "SELECT * FROM items WHERE receipt = ?",
                params: [receipt],
                callback: results => resolver(results as Item[])
            })
        })
    }

    async getReceipts(user: string): Promise<Receipt[]> {
        return new Promise<Receipt[]>(resolver => {
            database.query({
                query: "SELECT * FROM receipts WHERE user = ?",
                params: [user],
                callback: async results => {
                    const receipts: Receipt[] = []

                    for (const obj of results) {
                        const { id } = obj
                        const shop = (await this.getShop(obj.shop))!
                        const items = await this.getReceiptItems(id)
                        const receipt: Receipt = { id, items, shop }
                        receipts.push(receipt)
                    }

                    return resolver(receipts)
                }
            })
        })
    }
}