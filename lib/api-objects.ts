import { PrimaryType, SubType } from "prisma/prisma-client"

export interface SerializableRecurringExpense {
    date: number,
    primaryType: PrimaryType,
    subType: SubType,
    name: string,
    cost: number,
    frequencyString: string,
    has_gst: boolean,
    has_pst: boolean,
}