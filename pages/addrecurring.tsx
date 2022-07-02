import styles from '../styles/addrecurring.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, Prisma, SubType, SubtypesToPrimaryType } from 'prisma/prisma-client';
import { type } from 'os';
import { useCallback, useState } from 'react';
import Dropdown from '../components/dropdown';
import Textbox from '../components/textbox';
import { SerializableRecurringExpense } from '../lib/api-objects';
import { ExpenseRow, Frequency, PrimaryTypeMap } from '../lib/expense-row';
import { IsDefined, StripUndefined } from '../lib/dry';
import ExpenseInputRow from '../components/expenseinputrow';

// Server side data fetching
export async function getServerSideProps(context: any) {
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

    const props: AddRecurringProps = {
        primaryTypes: primaryTypes,
        subTypes: subTypes
    }

    return { props }
}


/*
    <---INTERFACES--->
*/

// The contents of props that will be passed
interface AddRecurringProps {
    primaryTypes: (PrimaryType & {
        subTypes: SubtypesToPrimaryType[];
    })[],
    subTypes: (SubType & {
        primaryTypes: SubtypesToPrimaryType[];
    })[]
}


/*
    <---FUNCTIONS--->
*/

const defaultExpenseRow = (props: AddRecurringProps) => {
    let subType = StripUndefined(props.subTypes.find(x => x.id === props.primaryTypes[0].subTypes[0].subTypeId));
    let row: ExpenseRow = {
        date: new Date(),
        primaryType: props.primaryTypes[0],
        subType: subType,
        isRecurring: true,
        name: '',
        cost: 0,
        frequency: Frequency.MONTHLY,
        has_gst: true,
        has_pst: true
    }

    return row;
}

function AddRecurring(props: AddRecurringProps) {
    const initialRows = useCallback(
        () => {
            let firstRow = defaultExpenseRow(props);
            firstRow.id = 0;
            return [firstRow,]
        },
        [props]
    )
    const initialCanRemove = () => {
        return false;
    }

    const [rows, setRows] = useState(initialRows);
    const [canRemove, setCanRemove] = useState(initialCanRemove)

    const updateRow = (updatedRow: ExpenseRow) => {
        if (IsDefined(updatedRow) && IsDefined(updatedRow.id)) {
            let rowCopy = structuredClone(rows);
            rowCopy[updatedRow.id] = updatedRow
            setRows(rowCopy)
        }
    }

    // Add an entry row
    const addRow = () => {
        let newRow = defaultExpenseRow(props);
        newRow.id = rows.length;
        let copy = structuredClone(rows)
        setRows([...copy, newRow]);
        if (rows.length >= 1) setCanRemove(true);
    }
    const removeRow = () => {
        if (!canRemove) return;
        let rowsCopy = structuredClone(rows);
        rowsCopy.pop();
        setRows(rowsCopy);
        if (rowsCopy.length < 2) setCanRemove(false);
    }

    // Take all data from rows and create it in the database
    function pushToDb() {
        if (rows.some(x => isNaN(x.date.valueOf()))) {
            console.error("INVALID DATE");
            alert("Invalid date");
            return;
        }
        const jsonData: SerializableRecurringExpense[] = rows.map(row => {
            return {
                date: new Date(row.date.toDateString()).getTime(), // Strip time from date
                primaryType: row.primaryType,
                subType: row.subType,
                name: row.name,
                cost: row.cost,
                frequencyString: Frequency[StripUndefined(row.frequency)],
                has_gst: row.has_gst,
                has_pst: row.has_pst,
            }
        })

        try {
            fetch('/api/recurring-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(jsonData)
            })
        } catch (error) {
            console.error(error);
        }
    }

    const typeMaps: PrimaryTypeMap[] = props.primaryTypes.map(x => {
        const map: PrimaryTypeMap = {
            primaryType: x as PrimaryType,
            subTypes: props.subTypes
                .filter(subType => 
                    x.subTypes.some(stpt => 
                        stpt.primaryTypeId === x.id && stpt.subTypeId === subType.id))   
        }
        return map;
    })

    return (
        <div className={styles.container}>
            <div className={styles.rows}>
                {rows.map((val, index) => {
                    return ( 
                        <ExpenseInputRow isRecurring={true} rowState={val} setRowState={updateRow}
                            types={typeMaps} baseKey={`row-input-${index}`} key={index}/>
                    )
                })}
            </div>            
            <div className={styles.footer_spacer} id="footer_spacer"></div>
            <div className={styles.footer} id="footer">
                <button className={styles.addRowButton} onClick={addRow}>Add Row</button>
                <button className={canRemove ? styles.removeRowButton : styles.disabledButton} onClick={removeRow}>Remove Row</button>
                <button className={styles.saveAllButton} onClick={pushToDb}>Push to DB</button>
            </div>
        </div>
    )
}

export default AddRecurring;