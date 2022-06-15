import styles from '../styles/addrecurring.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, Prisma, SubType, SubtypesToPrimaryType } from 'prisma/prisma-client';
import { type } from 'os';
import { useState } from 'react';
import Dropdown from '../components/dropdown';
import Textbox from '../components/textbox';

interface AddRecurringProps {
    typeMaps: TypeMap[],
}

interface TypeMap {
    primaryType: PrimaryType,
    subTypes: SubType[],
}

export async function getServerSideProps(context) {
    const dbPrimaryTypes = await prisma.primaryType.findMany({
        include: {
            subTypes: true,
        }
    });
    const dbSubTypes = await prisma.subType.findMany();

    // Create type maps (I really need to get better at naming things..)
    let typeMaps: TypeMap[] = []; // Create object to be sent as prop
    dbPrimaryTypes.forEach((primeType, index) => {
        const subTypes = primeType.subTypes.map(x => dbSubTypes.find(sub => sub.id === x.subTypeId));
        const filteredSubTypes: SubType[] = subTypes.filter(x => x); // Should filter anything that is null or undefined. Ignoring TS warning.
        typeMaps.push({
            primaryType: primeType,
            subTypes: filteredSubTypes
        })
    })

    const props: AddRecurringProps = {
        typeMaps: typeMaps,
    }
    return {props: props};
}

enum Frequency {
    DAILY,
    WEEKLY,
    BIWEEKLY,
    MONTHLY,
    QUARTERLY,
    SEMIANNUALLY,
    ANNUALLY
}

interface RecurringRow {
    date: Date,
    primaryType: PrimaryType,
    subType: SubType,
    name: string,
    cost: number,
    frequency: Frequency
}

function AddRecurring(props: AddRecurringProps) {
    const initialRows = () => {
        let firstRow: RecurringRow = {
            date: new Date(),
            primaryType: props.typeMaps[0].primaryType,
            subType: props.typeMaps[0].subTypes[0],
            name: '',
            cost: 0.0,
            frequency: Frequency.MONTHLY
        }
        
        return [firstRow,];
    }

    const [rows, setRows] = useState(initialRows);
    console.log(rows);

    function updateDate(rows: RecurringRow[], index: number, date: string): RecurringRow[] {
        let rowsCopy = [...rows];
        rowsCopy[index].date = new Date(date);
        return rowsCopy;
    }
    function updatePrimaryType(rows: RecurringRow[], index: number, selectedIndex: number): RecurringRow[] {
        let rowsCopy = [...rows];
        rowsCopy[index].primaryType = props.typeMaps[selectedIndex].primaryType;
        rowsCopy[index].subType = props.typeMaps[selectedIndex].subTypes[0];
        return rowsCopy;
    }
    function updateSubType(rows: RecurringRow[], index: number, selectedIndex: number): RecurringRow[] {
        let rowsCopy = [...rows];
        const subTypes = props.typeMaps.find(x => x.primaryType.id === rows[index].primaryType.id)?.subTypes;
        if (subTypes) rowsCopy[index].subType = subTypes[selectedIndex];
        return rowsCopy;
    }
    function updateName(rows: RecurringRow[], index: number, name: string): RecurringRow[] {
        let rowsCopy = [...rows];
        rowsCopy[index].name = name;
        return rowsCopy;
    }
    function updateCost(rows: RecurringRow[], index: number, cost: string): RecurringRow[] {
        let rowsCopy = [...rows];
        rowsCopy[index].cost = parseFloat(cost);
        return rowsCopy;
    }
    function updateFrequency(rows: RecurringRow[], index: number, frequency: string): RecurringRow[] {
        let rowsCopy = [...rows];
        rowsCopy[index].frequency = Frequency[frequency];
        return rowsCopy;
    }

    const InputRow = (row: RecurringRow, index: number) => {
        const baseKey = `recurring-row-${index}`;
        const subTypes = props.typeMaps.find(x => x.primaryType.id === row.primaryType.id)?.subTypes.map(x => x.name)
        return (
            <div className={styles.rowContainer} key={baseKey}>
                <div className={`${styles.rowObject} ${styles.rowDate}`} key={`${baseKey}-date-container`}>
                    <Textbox
                        baseKey={`${baseKey}-date`} 
                        defaultValue={row.date.toDateString()} 
                        onChangeCallback={(changeEvent, index) => 
                            {setRows(curVal => updateDate(curVal, index, changeEvent.target.value))}}
                    />
                </div>

                    <div className={`${styles.rowObject} ${styles.rowPrimeType}`} key={`${baseKey}-primetype-container`}>
                        <Dropdown 
                        baseKey={`${baseKey}-primeVal`}
                        values={props.typeMaps.map(x => x.primaryType.name)} 
                        defaultIndex={props.typeMaps.findIndex(x => x.primaryType.id === row.primaryType.id)}
                        callback={(selectedValue, selectedIndex, indexSource) => 
                            setRows(curVal => updatePrimaryType(curVal, indexSource, selectedIndex))}
                    />
                </div>
                
                <div className={`${styles.rowObject} ${styles.rowSubType}`} key={`${baseKey}-subtype-container`}>
                    <Dropdown
                        baseKey={`${baseKey}-subVal`}
                        values={subTypes ? subTypes : ['']}
                        callback={(_, selectedIndex, indexSource) =>
                            setRows(curVal => updateSubType(curVal, indexSource, selectedIndex))}
                    />
                </div>

                <div className={`${styles.rowObject} ${styles.rowNameInput}`} key={`${baseKey}-name-container`}>
                    <Textbox
                        baseKey={`${baseKey}-name`}
                        onChangeCallback={(changeEvent, index) => 
                            setRows(curVal => updateName(curVal, index, changeEvent.target.value))}
                    />
                </div>

                <div className={`${styles.rowObject} ${styles.rowCostInput}`} key={`${baseKey}-cost-container`}>
                    <Textbox
                            baseKey={`${baseKey}-cost`}
                            type="number"
                            onChangeCallback={(changeEvent, index) => 
                                setRows(curVal => updateCost(curVal, index, changeEvent.target.value))}
                    />
                </div>

                <div className={`${styles.rowObject} ${styles.rowFrequencyInput}`} key={`${baseKey}-frequency-container`}>
                    <Dropdown
                            baseKey={`${baseKey}-subVal`}
                            values={Object.keys(Frequency).filter((item) => isNaN(Number(item)))}
                                sort={false}
                            callback={(selectedValue, _, indexSource) =>
                                setRows(curVal => updateFrequency(curVal, indexSource, selectedValue))}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.rows}>
                {rows.map((row, index) => InputRow(row, index))}
            </div>
        </div>
    )
}

export default AddRecurring;