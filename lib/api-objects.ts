import { PrimaryType, SubType } from "prisma/prisma-client"

export interface SerializableSingleExpense {
    date: number,
    primaryType: PrimaryType,
    subType: SubType,
    name: string,
    cost: number,
    quantity: number,
    has_gst: boolean,
    has_pst: boolean
}

export interface SerializableRecurringExpense {
    date: number,
    primaryType: PrimaryType,
    subType: SubType,
    name: string,
    cost: number,
    frequency: string,
    has_gst: boolean,
    has_pst: boolean,
}