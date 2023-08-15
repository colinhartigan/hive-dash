import base from '@/lib/airtable';
import clientPromise from '@/lib/mongodb';
import dayjs from '@/lib/time';

export default async function handler(req, res) {
    const mongoClient = await clientPromise;

    if (req.method === 'POST') {
        let people = [];

        base('PI Tracker')
            .select({
                // Selecting the first 3 records in All:
                view: 'All',
                fields: ['Name', 'Current Status', 'MPI Role(s)'] //last one is MPI roles
            })
            .eachPage(
                function page(records, fetchNextPage) {
                    // This function (`page`) will get called for each page of records.

                    records.forEach((record) => {
                        if (record.get('Current Status')) {
                            if (
                                record.get('Current Status').includes('Returning') ||
                                record.get('Current Status').includes('Staff')
                            ) {
                                let role = 0;
                                if (record.get('MPI Role(s)')) {
                                    role = 1;
                                }
                                if (record.get('Current Status').includes('Staff')) {
                                    role = 2;
                                }

                                people.push({
                                    name: record.get('Name'),
                                    type: role
                                });
                            }
                        }
                    });

                    // To fetch the next page of records, call `fetchNextPage`.
                    // If there are more records, `page` will get called again.
                    // If there are no more records, `done` will get called.
                    fetchNextPage();
                },
                async function done(err) {
                    if (err) {
                        console.error(err);
                        res.status(500).end();
                    }

                    const existing = await mongoClient
                        .db('global-config')
                        .collection('peer-instructors')
                        .find()
                        .toArray();

                    const existingPeople = existing.map((pi) => pi.name);
                    const newPeople = people.filter((pi) => !existingPeople.includes(pi));
                    const oldPeople = existing.filter((pi) => !people.includes(pi.name));

                    // remove old people from database
                    if (oldPeople.length > 0) {
                        await mongoClient
                            .db('global-config')
                            .collection('peer-instructors')
                            .deleteMany({ name: { $in: oldPeople.map((pi) => pi.name) } });
                    }

                    // add new people to database
                    if (newPeople.length > 0) {
                        await mongoClient
                            .db('global-config')
                            .collection('peer-instructors')
                            .insertMany(newPeople.map((pi) => ({ name: pi.name, type: pi.type, email: '' })));

                        await mongoClient
                            .db('global-config')
                            .collection('general')
                            .updateOne(
                                { id: 'people' },
                                {
                                    $set: {
                                        lastUpdated: dayjs().toISOString()
                                    }
                                }
                            );

                        res.json({ success: true });
                        res.status(200).end();
                    }
                }
            );

        //const data = await mongoClient.db('global-config').collection('peer-instructors').find().toArray();

        //res.status(200).json({ peerInstructors: data });
    }
}
