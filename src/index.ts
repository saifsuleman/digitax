import express, { Application } from "express"
import { Server, createServer } from "http"
import AuthenticationHandler from "./authentication"
import ReceiptsHandler from "./receiptshandler";
import Item from "./item";

export default class DigitaxServer {
    server: Server;
    app: Application;
    authenticationHandler: AuthenticationHandler;
    receiptHandler: ReceiptsHandler;

    constructor() {
        this.authenticationHandler = new AuthenticationHandler();
        this.receiptHandler = new ReceiptsHandler();

        this.app = express()
        this.server = createServer(this.app)

        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());

        this.app.get("/", (req, res) => {
            res.status(302).redirect("https://youtube.com/")
        })
    
        /**
         * get receipt
         * add receipt (from shop owner)
         */

        this.app.get("/api/authenticate", (req, res) => this.authenticate(req, res))
        this.app.get("/api/checktoken", (req, res) => this.checkToken(req, res))
        this.app.get("/api/register", (req, res) => this.register(req, res))
        this.app.get("/api/receipt", (req, res) => this.viewReceipt(req, res))
        this.app.post("/api/addReceipt", (req, res) => this.addReceipt(req, res))
        this.app.get("/api/getReceipts", (req, res) => this.getReceipts(req, res))
    }

    async getReceipts(req: express.Request, res: express.Response) {
        const { token, maxLimit: maxLimitString } = req.query as { token: string, maxLimit: string }
        let maxLimitNumber = 0
        try {
            maxLimitNumber = parseInt(maxLimitString)
        } catch(_){
        }
        if (!token) {
            return res.status(400).send({ error: "invalid schema, required { token, maxLimit?: number }" })
        }
        const claim = await this.authenticationHandler.validateToken(token)
        if (!claim) {
            return res.status(401).send({ error: "invalid token" })
        }
        let receipts = await this.receiptHandler.getReceipts(claim.username)
        if (maxLimitNumber > 0) {
            receipts = receipts.slice(0, maxLimitNumber)
        }
        return res.status(200).send({ receipts })
    }

    async addReceipt(req: express.Request, res: express.Response){ 
        const { consumer, token, items: itemString, shop: shopId } = req.query as { consumer: string, token: string, items: string, shop: string }
        const items = JSON.parse(itemString) as Item[]
        if (!token || !items || !shopId) {
            return res.status(400).send({ error: "invalid schema, required { token, items, shop }" })
        }

        try {
            parseInt(shopId)
        } catch (_) {
            return res.status(400).send({ error: "invalid schema, required { shop: number }" })
        }

        const claim = await this.authenticationHandler.validateToken(token)
        if (!claim) {
            return res.status(400).send({ error: "invalid token" })
        }

        const shopIdNumber = parseInt(shopId)
        for (const s of claim.shops || []) {
            if (s.id === shopIdNumber) {
                this.receiptHandler.addReceipt(consumer, s, items)
                return res.status(200).send({ success: true })
            }
        }

        return res.status(200).send({ success: false, error: "Shop not found" })
    }

    async viewReceipt(req: express.Request, res: express.Response) {
        const { receiptId, token } = req.query as { receiptId: string; token: string; }
        if (!receiptId || !token) {
            return res.status(400).send({ error: "invalid schema, required { receiptId, token }" })
        }
        const claim = await this.authenticationHandler.validateToken(token)
        if (!claim) {
            return res.status(400).send({ error: "invalid token" })
        }
        const receipt = await this.receiptHandler.getReceiptItems(receiptId)
        if (!receipt) {
            return res.status(400).send({ error: "invalid receiptId" })
        }

        return res.status(200).send(receipt)
    }

    async authenticate(req: express.Request, res: express.Response) {
        const { username, password } = req.query as { username: string; password: string; }

        if (!username || !password) {
            return res.status(400).send({ error: "invalid schema, required { username, password }" })
        }

        const token = await this.authenticationHandler.authenticate(username, password)
        if (!token) {
            return res.status(400).send({ error: "invalid credentials" })
        }

        return res.status(200).send({ token, success: true })
    }

    async checkToken(req: express.Request, res: express.Response) {
        const { token } = req.query as { token: string; }

        if (!token) {
            return res.status(400).send({ error: "invalid schema, required { token }" })
        }

        const claim = await this.authenticationHandler.validateToken(token)
        if (!claim) {
            return res.status(400).send({ error: "invalid token" })
        }

        return res.status(200).send(claim)
    }

    async register(req: express.Request, res: express.Response) {
        const { username, password } = req.query as { username: string; password: string }
        if (!username || !password) {
            return res.status(400).send({ error: "invalid schema, required { username, password }" })
        }
        const result = await this.authenticationHandler.register(username, password)
        return res.status(result ? 200 : 400).send({ success: result })
    }   
}