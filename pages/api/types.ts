import { Prisma } from '@prisma/client'
import { create } from 'domain';
import { NextApiRequest, NextApiResponse } from 'next';
import { PrimaryTypeMap } from '../../lib/expense-row';
import prisma from '../../lib/prisma'

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const primaryTypes = await prisma.primaryType.findMany({
            include: {
                subTypes: true,
            }
        });
        const subTypes = await prisma.subType.findMany({
            include: {
                primaryTypes: true,
            }
        })
        let typeMaps: PrimaryTypeMap[] = primaryTypes.map(pType => {
            const map: PrimaryTypeMap = {
                primaryType: pType,
                subTypes: subTypes.filter(sType =>
                    pType.subTypes.some(stpt =>
                        stpt.subTypeId === sType.id))
            }
            return map;
        })
        res.status(200).json(typeMaps);
    }
}