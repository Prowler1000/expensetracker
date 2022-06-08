import { Prisma } from '@prisma/client'
import { create } from 'domain';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma.ts'

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        if (req.body.length > 1) {
            let data = req.body.map(val => {
                let rVal;
                rVal = {
                    date: val.date,
                    primaryTypeId: val.type.connect.id,
                    subTypeId: val.subType.connect.id,
                    name: val.name,
                    cost: val.cost,
                    quantity: val.quantity,
                    has_gst: val.has_gst,
                    has_pst: val.has_pst
                }
                return rVal;
            })
            const createMany = await prisma.singleExpense.createMany({
                data: data,
                skipDuplicates: true,
            })
        } else {
            const createOne = await prisma.singleExpense.create({
                data: req.body[0]
            })
        }
    }

    res.status(200).json({});
}