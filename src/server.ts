import express from "express";
import http from "http";
import AuthenticationHandler from "./authentication";
import ReceiptsHandler from "./receiptshandler";

export default class DigitaxServer {
  server: http.Server;
  app: express.Application;
  authhandler: AuthenticationHandler;
  receiptshandler: ReceiptsHandler;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);

    this.authhandler = new AuthenticationHandler();
    this.receiptshandler = new ReceiptsHandler()

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());

    this.app.get("/authenticate", (req: any, res: any) => this.authenticate(req, res));
    this.app.get(`/checktoken`, (req: any, res: any) => this.checkToken(req, res));
    this.app.post(`/register`, (req: any, res: any) => this.register(req, res));
    this.app.post(`/additem`, (req, res) => this.addItem(req, res))
    this.app.get(`/receipts`, (req, res) => this.getReceipts(req, res))
    this.app.post(`/deletereceipt`, (req, res) => this.deleteReceipt(req, res))
  }

  listen(port: number) {
    this.server.listen(port, "0.0.0.0", () =>
      console.log(`Listening on port ${port}`)
    );
  }

  async deleteReceipt(req: express.Request, res: express.Response) {
    const id: number = Number(req.query.id)
    this.receiptshandler.deleteReceipt(id)
    return res.status(200).send("ok")
  }

  async addItem(req: express.Request, res: express.Response) {
    const { user } = req.query as {
      user: string,
    }

    const shop = await this.receiptshandler.registerShop("Apple", "stevejobs")
    this.receiptshandler.addReceipt(user, shop, [{ name: "Macbook", price: 2000 }])
    return res.status(200).send({ success: 'ok' })
  }

  async getReceipts(req: express.Request, res: express.Response) {
    const { user } = req.query as {
      user: string,
    }

    const receipts = await this.receiptshandler.getReceipts(user)
    return res.status(200).send(receipts)
  }

  async register(req: express.Request, res: express.Response) {
    const { username, password } = req.query as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return res
        .status(400)
        .send({ error: "username and password fields required." });
    }

    const success = await this.authhandler.register(username, password);
    return res.status(200).send({ success });
  }

  async authenticate(req: express.Request, res: express.Response) {
    const { username, password } = req.query as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return res
        .status(400)
        .send({ error: "username and password fields required." });
    }

    const token = await this.authhandler.authenticate(username, password);
    if (!token) {
      return res.status(400).send({ error: "invalid login " });
    }

    return res.status(200).send({ token });
  }

  async checkToken(req: express.Request, res: express.Response) {
    const { token } = req.query as { token: string };

    if (!token) {
      return res.status(400).send({ error: "'token' field required" });
    }

    const claim = await this.authhandler.validateToken(token)
    if (!claim) {
      return res.status(400).send({ error: "invalid token" })
    }

    return res.status(200).send(claim)
  }
}
