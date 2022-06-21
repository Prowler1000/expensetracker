import styles from '../styles/addrecurring.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, Prisma, SubType, SubtypesToPrimaryType } from 'prisma/prisma-client';
import { type } from 'os';
import { useState } from 'react';
import Dropdown from '../components/dropdown';
import Textbox from '../components/textbox';
import { SerializableRecurringExpense } from '../lib/api-objects';

// The contents of props that will be passed
interface AddRecurringProps {
    typeMaps: TypeMap[],
}

// A list of each primary types relevant sub types
interface TypeMap {
    primaryType: PrimaryType,
    subTypes: SubType[],
}

// Server side data fetching
export async function getServerSideProps(context: any) {
    const dbPrimaryTypes = await prisma.primaryType.findMany({
        include: {
            subTypes: true,
        }
    });
    const dbSubTypes = await prisma.subType.findMany();

    // Create type maps (I really need to get better at naming things..)
    let typeMaps: TypeMap[] = []; // Create object to be sent as prop
    function notUndefined<TValue>(value: TValue | undefined): value is TValue {
        return value !== null && value !== undefined;
    }
    dbPrimaryTypes.forEach((primeType, index) => {
        const subTypes = primeType.subTypes.map(x => dbSubTypes.find(sub => sub.id === x.subTypeId));
        const filteredSubTypes: SubType[] = subTypes.filter(notUndefined); // Should filter anything that is null or undefined. Ignoring TS warning.
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

// The frequency that a recurring expense should occur
enum Frequency {
    DAILY,
    WEEKLY,
    BIWEEKLY,
    MONTHLY,
    QUARTERLY,
    SEMIANNUALLY,
    ANNUALLY
}

// Relevant fields of each entry row
interface RecurringRow {
    date: Date,
    primaryType: PrimaryType,
    subType: SubType,
    name: string,
    cost: number,
    frequency: Frequency,
    tax_scheme: TaxScheme
}

// Enum for what taxes are applied for this recurring expense
enum TaxScheme {
    BOTH,
    GST,
    PST,
    NONE
}


function AddRecurring(props: AddRecurringProps) {
    const initialRows = () => {
        let firstRow: RecurringRow = {
            date: new Date(),
            primaryType: props.typeMaps[0].primaryType,
            subType: props.typeMaps[0].subTypes[0],
            name: '',
            cost: 0.0,
            frequency: Frequency.MONTHLY,
            tax_scheme: TaxScheme.BOTH,
        }
        
        return [firstRow,];
    }
    const initialCanRemove = () => {
        return false;
    }

    const [rows, setRows] = useState(initialRows);
    const [canRemove, setCanRemove] = useState(initialCanRemove)

    // Add an entry row
    const addRow = () => {
        let copy = [...rows];
        let newRow: RecurringRow = {            
            date: new Date(),
            primaryType: props.typeMaps[0].primaryType,
            subType: props.typeMaps[0].subTypes[0],
            name: '',
            cost: 0.0,
            frequency: Frequency.MONTHLY,
            tax_scheme: TaxScheme.BOTH,
        }
        copy.push(newRow);
        if (!canRemove && copy.length > 1) setCanRemove(true);
        setRows(copy)
    }
    const removeRow = () => {
        if (!canRemove) return;
        let copy = [...rows];
        copy.pop();
        if (copy.length < 2) setCanRemove(false);
        setRows(copy);
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
                frequencyString: Frequency[row.frequency],
                frequencyIndex: row.frequency,
                has_gst: row.tax_scheme == TaxScheme.BOTH || row.tax_scheme == TaxScheme.GST,
                has_pst: row.tax_scheme == TaxScheme.BOTH || row.tax_scheme == TaxScheme.PST,
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
    // Functions to update the relevant parts of a row. Honestly a lot of these seem really inefficient.
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
        rowsCopy[index].frequency = Frequency[frequency as keyof typeof Frequency];
        return rowsCopy;
    }
    function updateTax(rows: RecurringRow[], index: number, value: string): RecurringRow[] {
        let rowsCopy = [...rows];
        if (value === "GST & PST") rowsCopy[index].tax_scheme = TaxScheme.BOTH;
        else if (value === "GST") rowsCopy[index].tax_scheme = TaxScheme.GST;
        else if (value === "PST") rowsCopy[index].tax_scheme = TaxScheme.PST;
        else rowsCopy[index].tax_scheme = TaxScheme.NONE;
        return rowsCopy;
    }

    // A React object that represents a row for entering data
    const InputRow = (index: number) => {
        const row = rows[index];
        const baseKey = `recurring-row-${index}`; // The base key of this row. Passed to components to ensure everything has a unique key
        const subTypes = props.typeMaps.find(x => x.primaryType.id === row.primaryType.id)?.subTypes.map(x => x.name)
        return (
            <div className={styles.rowContainer} key={baseKey}>
                <div className={`${styles.rowObject} ${styles.rowDate}`} key={`${baseKey}-date-container`}>
                    <Textbox
                        baseKey={`${baseKey}-date`} 
                        index={index}
                        defaultValue={row.date.toLocaleDateString()} 
                        onChangeCallback={(changeEvent, index) => 
                            {setRows(curVal => updateDate(curVal, index, changeEvent.target.value))}}
                    />
                </div>

                    <div className={`${styles.rowObject} ${styles.rowPrimeType}`} key={`${baseKey}-primetype-container`}>
                        <Dropdown 
                        baseKey={`${baseKey}-primeVal`}
                        index={index}
                        values={props.typeMaps.map(x => x.primaryType.name)} 
                        defaultIndex={props.typeMaps.findIndex(x => x.primaryType.id === row.primaryType.id)}
                        callback={(selectedValue, selectedIndex, indexSource) => 
                            setRows(curVal => updatePrimaryType(curVal, indexSource, selectedIndex))}
                    />
                </div>
                
                <div className={`${styles.rowObject} ${styles.rowSubType}`} key={`${baseKey}-subtype-container`}>
                    <Dropdown
                        baseKey={`${baseKey}-subVal`}
                        index={index}
                        values={subTypes ? subTypes : ['']}
                        callback={(_, selectedIndex, indexSource) =>
                            setRows(curVal => updateSubType(curVal, indexSource, selectedIndex))}
                    />
                </div>

                <div className={`${styles.rowObject} ${styles.rowNameInput}`} key={`${baseKey}-name-container`}>
                    <Textbox
                        baseKey={`${baseKey}-name`}
                        index={index}
                        onChangeCallback={(changeEvent, index) => 
                            setRows(curVal => updateName(curVal, index, changeEvent.target.value))}
                    />
                </div>

                <div className={`${styles.rowObject} ${styles.rowCostInput}`} key={`${baseKey}-cost-container`}>
                    <Textbox
                            baseKey={`${baseKey}-cost`}
                            index={index}
                            type="number"
                            onChangeCallback={(changeEvent, index) => 
                                setRows(curVal => updateCost(curVal, index, changeEvent.target.value))}
                    />
                </div>

                <div className={`${styles.rowObject} ${styles.rowFrequencyInput}`} key={`${baseKey}-frequency-container`}>
                    <Dropdown
                            baseKey={`${baseKey}-frequency`}
                            index={index}
                            values={Object.keys(Frequency).filter((item) => isNaN(Number(item)))}
                            defaultIndex={row.frequency}
                            sort={false}
                            callback={(selectedValue, _, indexSource) =>
                                setRows(curVal => updateFrequency(curVal, indexSource, selectedValue))}
                    />
                </div>

                <div className={`${styles.rowObject} ${styles.rowTaxScheme}`} key={`${baseKey}-tax-container`}>
                    <Dropdown
                            baseKey={`${baseKey}-taxScheme`}
                            index={index}
                            values={["GST & PST", "GST", "PST", "NONE"]}
                            sort={false}
                            callback={(selectedValue, _, indexSource) =>
                                setRows(curVal => updateTax(curVal, indexSource, selectedValue))}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.rows}>
                {rows.map((row, index) => InputRow(index))}
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