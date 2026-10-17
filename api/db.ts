import dbStatusHandler from './db-status';

export default async function handler(req: any, res: any) {
  return dbStatusHandler(req, res);
}

export * from './_db';
