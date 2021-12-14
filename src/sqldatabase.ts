import mysql, { FieldInfo } from "mysql"

export class Database {
    pool: mysql.Pool;

    constructor(host: string, user: string, password: string, database: string, connectionLimit = 10) {
        this.pool = mysql.createPool({ host, user, password, database, connectionLimit })
    }

    query({ query, params, callback }: QueryOptions): mysql.Query {
        if (params) {
            query = mysql.format(query, params)
        }
        return this.pool.query(query, (err, results, fields) => {
            if (err) throw err;
            if (callback) callback(results, fields)
        })
    }
}

export interface QueryOptions {
    query: string;
    params?: any[];
    callback?: (results?: any, fields?: FieldInfo[]) => void;
}

export default new Database(`127.0.0.1`, 'root', 'saifsuleman', 'codeit')