import styles from '../styles/add.module.css'
import {useState, useEffect, ChangeEvent} from 'react'
import Dropdown from '../components/dropdown';
import Textbox from '../components/textbox';
import prisma from '../lib/prisma';
import { PrimaryType, Prisma, SubType, SubtypesToPrimaryType } from 'prisma/prisma-client';

export async function getServerSideProps(context) {
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

interface AddProps {
    primaryTypes: (PrimaryType & {
        subTypes: SubtypesToPrimaryType[];
    })[],
    subTypes: (SubType & {
        primaryTypes: SubtypesToPrimaryType[];
    })[]
}

interface Row {
    date: Date,
    primaryType: PrimaryType,
    subType: SubType,
    name: string,
    cost: number,
    quantity: number,
    tax: TaxScheme
}

enum TaxScheme {
    BOTH,
    GST,
    PST,
    NONE,
}

function rowToSerializable(row: Row): Prisma.SingleExpenseCreateInput {
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
        has_gst: (row.tax === TaxScheme.BOTH || row.tax === TaxScheme.GST),
        has_pst: (row.tax === TaxScheme.BOTH || row.tax === TaxScheme.PST)
    }
    return rVal;
}

function Add(props: AddProps) {
    const setInitialRows = () => {
        const rowDefault: Row = {
            date: new Date(),
            primaryType: props.primaryTypes[0],
            subType: {
                id: 0,
                name: ''
            },
            name: '',
            cost: 0,
            quantity: 1,
            tax: TaxScheme.BOTH
        }
        return [rowDefault,]
    }

    const setInitialCanRemove = () => {
        return rows.length > 1;
    }

    const [tableEntries, setTableEntries] = useState([]);
    const [rows, setRows] = useState(setInitialRows);
    const [canRemove, setCanRemove] = useState(setInitialCanRemove);

    function addRow() {
        setRows([...rows, setInitialRows()[0]])
        if (rows.length > 0) setCanRemove(true);
    }

    function removeRow() {
        let rowsCopy = [...rows];
        rowsCopy.pop();
        setRows(rowsCopy);
        if (rowsCopy.length < 2) setCanRemove(false);
    }

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

    function handleDateChange(value: string, index: number): void {
        throw new Error('Function not implemented.');
    }
    
    function updatePrimaryType(selectedValue: string, selectedIndex: number, indexSource: number): void {
        const primaryType = props.primaryTypes[selectedIndex];
        let rowsCopy = [...rows];
        rowsCopy[indexSource].primaryType = primaryType;
        setRows(rowsCopy);
    }

    function updateSubType(selectedValue: string, selectedIndex: number, indexSource: number): void {
        const subType = props.subTypes.find(st => st.name === selectedValue);
        if (subType) {            
            let rowsCopy = [...rows];
            rowsCopy[indexSource].subType = subType;
        }
    }

    function updateProductName(event: ChangeEvent<HTMLInputElement>, index?: number) {
        if (typeof index !== 'undefined') {
            let rowsCopy = [...rows];
            rowsCopy[index].name = event.target.value;
            setRows(rowsCopy);
        }
    }

    function updateProductPrice(event: ChangeEvent<HTMLInputElement>, index?: number) {
        if (typeof index !== 'undefined') {
            let rowsCopy = [...rows];
            rowsCopy[index].cost = parseFloat(event.target.value);
            setRows(rowsCopy);
        }
    }

    function updateTaxScheme(selectedValue: string, selectedIndex: number, indexSource: number): void {
        let rowsCopy = [...rows];
        let tax = TaxScheme.BOTH;
        if (selectedValue === "GST") tax = TaxScheme.GST;
        else if (selectedValue === "PST") tax = TaxScheme.PST;
        else if (selectedValue === "None") tax = TaxScheme.NONE;
        rowsCopy[indexSource].tax = tax;
        setRows(rowsCopy); 
    }


    const TableRow = (index: number, row: Row) => {
        const subTypeList = props.subTypes.filter(st => st.primaryTypes.some(pt => pt.primaryTypeId === row.primaryType.id)).map(x => x.name)
        return (
            <div className={styles.row} key={`row-${index}`}>

                <div className={`${styles.paramContainer} ${styles.dateContainer}`} key={`row-date-${index}`}>
                    <div className={styles.paramTitle}>Date:</div>
                    <input type="text" className={styles.paramInput} onChange={e => handleDateChange(e.target.value, index)} 
                        value={new Date().toLocaleDateString()} id={`${index}-date`}></input>
                </div>

                <div className={`${styles.paramContainer} ${styles.typeContainer}`} key={`row-primaryType-${index}`}>
                    <div className={styles.paramTitle}>Primary Type:</div>
                    <Dropdown defaultIndex={0} values={props.primaryTypes.map(x => x.name)} callback={updatePrimaryType} index={index} baseKey={`primaryTypes-${index}`}/>
                </div>

                <div className={`${styles.paramContainer} ${styles.typeContainer}`} key={`row-subtype-${index}`}>
                    <div className={styles.paramTitle}>Sub Type:</div>
                    <Dropdown defaultIndex={0} baseKey={`subTypes-${index}`} index={index} values={subTypeList} callback={updateSubType}/>
                </div>

                <div className={`${styles.paramContainer} ${styles.nameContainer}`} key={`row-name-${index}`}>
                    <div className={styles.paramTitle}>Product Name:</div>
                    <Textbox type="text" className={styles.paramInput} id={`${index}-name`} index={index} onChangeCallback={updateProductName}></Textbox>
                </div>

                <div className={`${styles.paramContainer} ${styles.priceContainer}`} key={`row-price-${index}`}>
                    <div className={styles.paramTitle}>Product Price:</div>
                    <Textbox onChangeCallback={updateProductPrice} type="number" className={styles.paramInput} index={index}></Textbox>
                </div>

                <div className={`${styles.paramContainer} ${styles.quantity}`}>
                    <div className={styles.paramTitle}>Quantity:</div>
                    <input type="number" id={`quantity-${index}`} className={styles.paramInput}></input>
                </div>

                <div className={`${styles.paramContainer} ${styles.taxContainer}`} key={`row-tax-${index}`}>
                    <div className={styles.paramTitle}>Product Tax Scheme</div>
                    <Dropdown defaultIndex={0} values={["GST & PST", "GST", "PST", "None"]} callback={updateTaxScheme} index={index} 
                        baseKey={`taxScheme-${index}`} className={styles.taxDropdown}/>
                </div>

            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.entries} id="entries">
                {rows.map((row, index) => TableRow(index, row))}
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
