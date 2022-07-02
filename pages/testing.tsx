import { PrimaryType, SingleExpense, SubType, SubtypesToPrimaryType, Tax } from 'prisma/prisma-client'
import styles from '../styles/testing.module.css'
import prisma from '../lib/prisma';
import Dropdown from '../components/dropdown';
import Textbox from '../components/textbox';
import ExpenseInputRow from '../components/expenseinputrow';
import { ExpenseRow, Frequency, PrimaryTypeMap, useExpenseRow } from '../lib/expense-row';
import { StripUndefined } from '../lib/dry';
import { cloneElement, useState } from 'react';

interface TestingProps {
    primaryTypes: (PrimaryType & {
        subTypes: SubtypesToPrimaryType[];
    })[],
    subTypes: SubType[]
}

export async function getServerSideProps(context: any) {
    const primaryTypes = await prisma.primaryType.findMany({
        include: {
            subTypes: true,
        }
    })
    const subTypes: SubType[] = await prisma.subType.findMany()
    return { 
        props: {
            primaryTypes: primaryTypes,
            subTypes: subTypes,
        }
    }
}

export default function Testing(props: TestingProps) {
    const initialExpenseRow = () => {
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
    const [row, setRow] = useExpenseRow(initialExpenseRow)
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

    console.log(row)

    return(
        <div className={styles.container}>
            <ExpenseInputRow isRecurring={row.isRecurring} rowState={row} setRowState={setRow} types={typeMaps} baseKey={'expense-test'}></ExpenseInputRow>
        </div>
    )
}