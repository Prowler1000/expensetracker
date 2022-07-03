import { Prisma, RecurranceScheme } from '@prisma/client'
import { create } from 'domain';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma'
import { SerializableRecurringExpense } from '../../lib/api-objects';

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const recurringExpenses = req.body as SerializableRecurringExpense[];
        const data: Prisma.RecurringExpenseCreateManyInput[] = recurringExpenses.map(expense => {
            const recurringExpense: Prisma.RecurringExpenseCreateManyInput = {
                dateStarted: (new Date(expense.date)).toISOString(),
                name: expense.name,
                cost: expense.cost,
                frequency: RecurranceScheme[expense.frequency as keyof typeof RecurranceScheme],
                primaryTypeId: expense.primaryType.id,
                subTypeId: expense.subType.id,
                has_gst: expense.has_gst,
                has_pst: expense.has_pst
            }
            return recurringExpense
        })
        const createMany = await prisma.recurringExpense.createMany({
            data: data,
            skipDuplicates: true,
        })
    }

    res.status(200).json({});
}