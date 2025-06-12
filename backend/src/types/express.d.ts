import 'express';

declare module 'express' {
    export interface Request {
        body: any;
        params: Record<string, string>;
        query: Record<string, string>;
    }
}
