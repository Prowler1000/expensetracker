import styles from '../styles/add.module.css'
import {useState, useEffect, ChangeEvent, useCallback} from 'react'
import Dropdown from '../components/dropdown';
import Textbox from '../components/textbox';
import prisma from '../lib/prisma';
import { PrimaryType, Prisma, SubType, SubtypesToPrimaryType } from 'prisma/prisma-client';
import { IsDefined, StripUndefined } from '../lib/dry';
import { ExpenseRow, Frequency, PrimaryTypeMap } from '../lib/expense-row';
import ExpenseInputRow from '../components/expenseinputrow';

/*
    This page was created before I switched over to TypeScript so it's not quite "the same" as others
*/

// Server side data fetching. Maybe this is the superior location for these...
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

    const props: AddProps = {
        primaryTypes: primaryTypes,
        subTypes: subTypes
    }

    return { props }
}

// The interface for props that will be passed
interface AddProps {
    primaryTypes: (PrimaryType & {
        subTypes: SubtypesToPrimaryType[];
    })[],
    subTypes: (SubType & {
        primaryTypes: SubtypesToPrimaryType[];
    })[]
}

// Interface for each row of data entry
interface Row {
    date: Date,
    primaryType: PrimaryType,
    subType: SubType,
    name: string,
    cost: number,
    quantity: number,
    tax: TaxScheme
}

// Enum for taxes that apply to each purchase
enum TaxScheme {
    BOTH,
    GST,
    PST,
    NONE,
}

// Makes a row serializable to send with the API
function rowToSerializable(row: ExpenseRow): Prisma.SingleExpenseCreateInput {
    let rVal: Prisma.SingleExpenseCreateInput;
    rVal = {
        date: new Date(row.date).toISOString(),
        type: {
            connect: {
                id: row.primaryType.id
            }
        },
        subType: {
            connect: {
                id: row.subType.id
            }
        },
        name: row.name,
        cost: row.cost,
        quantity: row.quantity,
        has_gst: row.has_gst,
        has_pst: row.has_pst
    }
    return rVal;
}

const defaultExpenseRow = (props: AddProps) => {
    let subType = StripUndefined(props.subTypes.find(x => x.id === props.primaryTypes[0].subTypes[0].subTypeId));
    let row: ExpenseRow = {
        date: new Date(),
        primaryType: props.primaryTypes[0],
        subType: subType,
        isRecurring: false,
        name: '',
        cost: 0,
        frequency: Frequency.MONTHLY,
        has_gst: true,
        has_pst: true
    }

    return row;
}

function Add(props: AddProps) {
    const setInitialRows = useCallback(
        () => {
            let firstRow = defaultExpenseRow(props);
            firstRow.id = 0;
            return [firstRow,]
        },
        [props]
    )

    const setInitialCanRemove = useCallback(
        () => {
            return false
        },
        [props]
    )

    const [canRemove, setCanRemove] = useState(setInitialCanRemove);
    const [rows, setRows] = useState(setInitialRows);

    const updateRow = (updatedRow: ExpenseRow) => {
        if (IsDefined(updatedRow) && IsDefined(updatedRow.id)) {
            let rowCopy = structuredClone(rows);
            rowCopy[updatedRow.id] = updatedRow
            setRows(rowCopy)
        }
    }

    function addRow() {
        let newRow = defaultExpenseRow(props);
        newRow.id = rows.length;
        let copy = structuredClone(rows)
        setRows([...copy, newRow]);
        if (rows.length >= 1) setCanRemove(true);
    }

    function removeRow() {
        if (!canRemove) return;
        let rowsCopy = structuredClone(rows);
        rowsCopy.pop();
        setRows(rowsCopy);
        if (rowsCopy.length < 2) setCanRemove(false);
    }

    // Pushes data entered to database
    function pushToDb() {
        let bodyContent: Prisma.SingleExpenseCreateInput[] = [];

        rows.forEach(row => {
            bodyContent.push(rowToSerializable(row));
        })

        try {
            fetch('/api/single-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(bodyContent)
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
            <div className={styles.entries} id="entries">
                {rows.map((val, index) => {
                    return ( 
                        <ExpenseInputRow isRecurring={false} rowState={val} setRowState={updateRow}
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

export default Add;
