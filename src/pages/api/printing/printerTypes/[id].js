import { ObjectId } from 'mongodb';

import { validateRequest } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

import { PITypes } from '@/util/roles';

export default async function handler(req, res) {
    const mongoClient = await clientPromise;
    const { id } = req.query;

    if (req.method === 'PUT') {
        let uid,
            allowed = await validateRequest(req, PITypes.PI);
        if (!allowed) return res.status(401).json({ message: 'Unauthorized' });

        const body = req.body;

        delete body._id;

        const data = await mongoClient
            .db('printing')
            .collection('printer-types')
            .updateOne(
                {
                    _id: new ObjectId(id)
                },
                {
                    $set: {
                        ...body
                    }
                }
            );

        res.status(200).json(data);
    } else if (req.method === 'DELETE') {
        let uid,
            allowed = await validateRequest(req, PITypes.MPI);
        if (!allowed) return res.status(401).json({ message: 'Unauthorized' });

        const data = await mongoClient
            .db('printing')
            .collection('printer-types')
            .deleteOne({
                _id: new ObjectId(id)
            });

        res.status(200).json(data);
    }
}
