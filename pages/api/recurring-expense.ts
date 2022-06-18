import { Prisma, RecurranceScheme } from '@prisma/client'
import { create } from 'domain';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma.ts'
import { SerializableRecurringExpense } from '../../lib/api-objects';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        console.log(req.body);
        let body: SerializableRecurringExpense[] = req.body;
        let data = body.map(x => {
            const entry: Prisma.RecurringExpenseCreateManyInput = {
                dateStarted: new Date(x.date).toISOString(),
                name: x.name,
                cost: x.cost,
                frequency: RecurranceScheme[x.frequencyString],
                primaryTypeId: x.primaryType.id,
                subTypeId: x.subType.id
            }
            return entry;
        })
        console.log(data);
        const createMany = await prisma.recurringExpense.createMany({
            data: data,
            skipDuplicates: true,
        })
        console.log(createMany);
    }

    res.status(200).json({});
}