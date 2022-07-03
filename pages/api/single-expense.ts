import { Prisma } from '@prisma/client'
import { create } from 'domain';
import { NextApiRequest, NextApiResponse } from 'next';
import { SerializableSingleExpense } from '../../lib/api-objects';
import prisma from '../../lib/prisma'

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const singleExpenses = req.body as SerializableSingleExpense[]
        let data: Prisma.SingleExpenseCreateManyInput[] = singleExpenses.map(expense => {
            const singleExpense: Prisma.SingleExpenseCreateManyInput = {
                date: (new Date(expense.date)).toISOString(),
                primaryTypeId: expense.primaryType.id,
                subTypeId: expense.subType.id,
                name: expense.name,
                cost: expense.cost,
                quantity: expense.quantity,
                has_gst: expense.has_gst,
                has_pst: expense.has_pst
            }
            return singleExpense
        })
        const createMany = await prisma.singleExpense.createMany({
            data: data,
            skipDuplicates: true
        })
    }

    res.status(200).json({});
}