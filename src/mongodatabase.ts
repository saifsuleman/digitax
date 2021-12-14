import mongodb, { MongoClient } from "mongodb";

export class EnrichmentDB {
  mongo: mongodb.MongoClient | undefined;

  constructor(url: string) {
    MongoClient.connect(
      url,
      {},
      (
        err: mongodb.AnyError | undefined,
        db: mongodb.MongoClient | undefined
      ) => {
        if (err) throw err;
        if (!db) throw "unable to load mongo database!";

        this.mongo = db;
        console.log("set");
      }
    );
  }

  db(id: string) {
    return this.mongo?.db(id);
  }
}

export default new EnrichmentDB(`mongodb://127.0.0.1:27017/`);
