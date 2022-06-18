import { PrimaryType, SubType } from "prisma/prisma-client"

export interface SerializableRecurringExpense {
    date: number,
    primaryType: PrimaryType,
    subType: SubType,
    name: string,
    cost: number,
    frequencyIndex: number,
    frequencyString: string,
}