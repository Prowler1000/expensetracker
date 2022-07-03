import { PrimaryType, SubType } from "prisma/prisma-client"

export interface SerializableExpense {
    date: number,
    primaryType: PrimaryType,
    subType: SubType,
    name: string,
    cost: number,
    has_gst: boolean,
    has_pst: boolean
}

export interface SerializableSingleExpense extends SerializableExpense{
    quantity: number
}

export interface SerializableRecurringExpense extends SerializableExpense{
    frequency: string
}

export interface InternalExpense extends SerializableExpense {
    taxRate: number,
}

export interface InternalSingleExpense extends InternalExpense, SerializableSingleExpense {

}

export interface InternalRecurringExpense extends InternalExpense, SerializableRecurringExpense {
    lastOccurance: number,
    nextOccurance: number,
}