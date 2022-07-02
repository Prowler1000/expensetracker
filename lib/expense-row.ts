import { PrimaryType, SubType } from "prisma/prisma-client"
import { useState } from "react"

export enum Frequency {
    DAILY,
    WEEKLY,
    BIWEEKLY,
    MONTHLY,
    QUARTERLY,
    SEMIANNUALLY,
    ANNUALLY
}

export interface ExpenseRow {
    date: Date,
    primaryType: PrimaryType,
    subType: SubType,
    isRecurring: boolean,
    name: string,
    cost: number,
    quantity?: number,
    frequency?: Frequency,
    has_gst: boolean,
    has_pst: boolean
}

export interface PrimaryTypeMap {
    primaryType: PrimaryType,
    subTypes: SubType[]
}

export function useExpenseRow(initialValue: ExpenseRow | (() => ExpenseRow)): [ExpenseRow, React.Dispatch<React.SetStateAction<ExpenseRow>>] {
    let val = typeof initialValue === 'function' ? initialValue() : initialValue
    const [state, setState] = useState(val);
    return [state, setState];
}