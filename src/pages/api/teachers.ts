import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await connectDB();
    const collection = db.collection('teachers');

    switch (req.method) {
      case 'GET':
        const teachers = await collection.find({}).toArray();
        return res.status(200).json(teachers);

      case 'POST':
        const { email, password, name } = req.body;
        const result = await collection.insertOne({ email, password, name });
        return res.status(201).json(result);

      case 'DELETE':
        const { id } = req.query;
        await collection.deleteOne({ _id: id });
        return res.status(200).json({ message: 'Teacher deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
