import { ObjectId } from 'mongodb';

import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
    const mongoClient = await clientPromise;
    const { printerId } = req.query;

    if (req.method === 'PUT') {
        const body = req.body;

        delete body._id;

        const data = await mongoClient
            .db('printing')
            .collection('printers')
            .updateOne(
                {
                    _id: new ObjectId(printerId)
                },
                {
                    $set: {
                        ...body
                    }
                }
            );

        res.status(200).json(data);
    } else if (req.method === 'DELETE') {
        const data = await mongoClient
            .db('printing')
            .collection('printers')
            .deleteOne({
                _id: new ObjectId(printerId)
            });

        res.status(200).json(data);
    }
}
