import clientPromise from '../../../lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function handler(req, res) {
    const mongoClient = await clientPromise;

    const { printId } = req.query;

    const data = await mongoClient.db("hive-prints").collection("print-log").find({ _id: new ObjectId(printId) }).toArray();

    res.status(200).json({ print: data[0] });
}
