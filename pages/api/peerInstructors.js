// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import clientPromise from '../../lib/mongodb'

export default async function handler(req, res) {
    const mongoClient = await clientPromise;

    const data = await mongoClient.db("hive-prints").collection("peer-instructors").find().toArray();

    res.status(200).json(data);
}
