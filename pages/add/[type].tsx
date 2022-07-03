import styles from '../../styles/add.module.css';
import { PrimaryType, Prisma, SubType, SubtypesToPrimaryType } from 'prisma/prisma-client';
import React, { useCallback, useEffect, useState } from 'react';
import { SerializableRecurringExpense, SerializableSingleExpense } from '../../lib/api-objects';
import { ExpenseRow, Frequency, PrimaryTypeMap } from '../../lib/expense-row';
import { IsDefined, StripUndefined } from '../../lib/dry';
import ExpenseInputRow from '../../components/expenseinputrow';

export async function getServerSideProps(context: any) {
    return {
        props: {
            type: context.params.type
        }
    }
}

interface AddProps {
    type: string,
}

const defaultExpenseRow = (primaryType: PrimaryType, subType: SubType, isRecurring: boolean) => {
    let row: ExpenseRow = {
        date: new Date(),
        primaryType: primaryType,
        subType: subType,
        isRecurring: isRecurring,
        name: '',
        cost: 0,
        frequency: isRecurring ? Frequency.MONTHLY : undefined,
        has_gst: true,
        has_pst: true
    }

    return row;
}

const pushToDb = (rows: ExpenseRow[]) => {
    let singleExpenses: SerializableSingleExpense[] = [];
    let recurringExpenses: SerializableRecurringExpense[] = [];
    rows.forEach(row => {
        if (row.isRecurring) {
            recurringExpenses.push(expenseRowToSerializable(row) as SerializableRecurringExpense)
        }
        else {
            singleExpenses.push(expenseRowToSerializable(row) as SerializableSingleExpense)
        }
    })
    if (singleExpenses.length > 0) {
        try {
            fetch('/api/single-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(singleExpenses)
            })
        } catch (error) {
            console.error(error);
        }
    }
    if (recurringExpenses.length > 0) {
        try {
            fetch('/api/recurring-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(recurringExpenses)
            })
        } catch (error) {
            console.error(error)
        }
    }
}

const expenseRowToSerializable = (row: ExpenseRow): SerializableSingleExpense | SerializableRecurringExpense => {
    if (row.isRecurring) {
        const serializable: SerializableRecurringExpense = {
            date: row.date.getTime(),
            primaryType: row.primaryType,
            subType: row.subType,
            name: row.name,
            cost: row.cost,
            frequency: Frequency[StripUndefined(row.frequency)],
            has_gst: row.has_gst,
            has_pst: row.has_pst
        }
        return serializable;
    }
    else {
        const serializable: SerializableSingleExpense = {
            date: row.date.getTime(),
            primaryType: row.primaryType,
            subType: row.subType,
            name: row.name,
            cost: row.cost,
            quantity: StripUndefined(row.quantity),
            has_gst: row.has_gst,
            has_pst: row.has_pst
        }
        return serializable;
    }
}

export default function Add(props: AddProps) {
    const [defaultRow, setDefaultRow] = useState(null as ExpenseRow | unknown);
    const [typeMaps, setTypeMaps] = useState([] as PrimaryTypeMap[]);
    const [rows, setRows] = useState([] as ExpenseRow[]);
    const [canRemove, setCanRemove] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const updateRow = (row: ExpenseRow) => {
        if (IsDefined(row) && IsDefined(row.id)) {
            let rowsCopy = structuredClone(rows);
            rowsCopy[row.id] = row;
            setRows(rowsCopy);
        }
    }

    const addRow = () => {
        let newRow = defaultRow as ExpenseRow;
        newRow.id = rows.length;
        let copy = [...rows, newRow]
        setRows(structuredClone(copy))
        if (!canRemove && copy.length > 1) setCanRemove(true);
    }

    const removeRow = () => {
        if (!canRemove) return;
        let copy = [...rows]
        copy.pop();
        setRows(structuredClone(copy));
        if (copy.length < 2) setCanRemove(false);
    }

    useEffect(() => {
        setRows([] as ExpenseRow[])
        fetch('/api/types')
            .then((res) => res.json())
            .then((data) => {
                const typeMaps = data as PrimaryTypeMap[];
                setTypeMaps(typeMaps)
                let defaultVal = defaultExpenseRow(typeMaps[0].primaryType, typeMaps[0].subTypes[0], props.type.includes("recurring"))
                defaultVal.id = 0;
                setDefaultRow(defaultVal)
                setRows([defaultVal,])
                setIsLoading(false);
            })
    }, [props.type])

    return (
        <div className={styles.container}>
            <div className={styles.entryRows}>
                {rows.map((val, index) => {
                    return (
                        <ExpenseInputRow rowState={val} setRowState={updateRow}
                            types={typeMaps} baseKey={`row-input-${index}`} key={`row-input-${index}-exterior`}/>
                    )
                })}
            </div>
            <div className={styles.footer_spacer} id="footer_spacer"></div>
            <div className={styles.footer} id="footer">
                <button className={styles.addRowButton} onClick={addRow}>Add Row</button>
                <button className={canRemove ? styles.removeRowButton : styles.disabledButton} onClick={removeRow}>Remove Row</button>
                <button className={styles.saveAllButton} onClick={() => pushToDb(rows)}>Push to DB</button>
            </div>
        </div>
    )
}