import styles from './styles/expenseinputrow.module.css'
import React, { useEffect, useState, useCallback, SetStateAction } from 'react';
import { ExpenseRow, Frequency, PrimaryTypeMap } from '../lib/expense-row';
import Dropdown from './dropdown';
import { StripUndefined } from '../lib/dry';
import Textbox from './textbox';

interface ExpenseInputProps {
    isRecurring?: boolean,
    rowState: ExpenseRow,
    setRowState: (arg0: ExpenseRow) => void,
    types: PrimaryTypeMap[],
    baseKey: string
}

const quantityBox = (baseKey: string, onChange: (arg0: React.ChangeEvent<HTMLInputElement>) => void) => {
    return (
        <div className={`${styles.paramContainer} ${styles.priceContainer}`} key={`${baseKey}-quantity-container`}>
            <div className={styles.paramTitle} key={`${baseKey}-name-title`}>Quantity:</div>
            <input type="number" onChange={onChange} className={styles.paramInput}></input>
        </div>
    )
}

const frequencyBox = (baseKey: string, onChange: (arg0: string) => void, values: string[], defaultFreq: Frequency) => {
    return (
        <div className={`${styles.paramContainer} ${styles.frequencyContainer}`} key={`${baseKey}-frequency-container`}>
            <div className={styles.paramTitle} key={`${baseKey}-frequency-title`}>Frequency:</div>
            <Dropdown
                baseKey={`${baseKey}-frequency-dropdown`}
                values={values}
                defaultIndex={defaultFreq}
                sort={false}
                callback={(selectedValue: string, selectedIndex: number, indexSource: number) => onChange(selectedValue)}
            />
        </div>
    )
}

export default function ExpenseInputRow(props: ExpenseInputProps) {
    const subTypes = StripUndefined(
        props.types.find(x => x.primaryType.id === props.rowState.primaryType.id)
        ?.subTypes)

    const handleDateChange = useCallback(
        (newValue: string) => {
            let rowCopy = structuredClone(props.rowState);
            rowCopy.date = new Date(newValue)
            props.setRowState(rowCopy);
        },
        [props.rowState]
    )
    const handlePrimaryTypeChange = useCallback(
        (a:string, selectedIndex: number, b:number) => {
            let rowCopy = structuredClone(props.rowState);
            rowCopy.primaryType = props.types[selectedIndex].primaryType;
            props.setRowState(rowCopy);
        },
        [props.rowState]
    )
    const handleSubTypeChange = useCallback(
        (a:string, selectedIndex: number, b:number) => {
            let rowCopy = structuredClone(props.rowState);
            rowCopy.subType = subTypes[selectedIndex]
            props.setRowState(rowCopy)
        },
        [props.rowState]
    )
    const handleNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>, a: number) => {
            let rowCopy = structuredClone(props.rowState);
            rowCopy.name = event.target.value;
            props.setRowState(rowCopy);
        },
        [props.rowState]
    )

    const handleCostChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>, a: number) => {
            let rowCopy = structuredClone(props.rowState);
            rowCopy.cost = Number(event.target.value),
            props.setRowState(rowCopy);
        },
        [props.rowState]
    )

    const handleQuantityChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            let rowCopy = structuredClone(props.rowState);
            rowCopy.quantity = Number(event.target.value);
            props.setRowState(rowCopy);
        },
        [props.rowState]
    )

    const handleTaxChange = useCallback( 
        (value: string) => {
            let rowCopy = structuredClone(props.rowState);
            rowCopy.has_gst = value.includes("GST");
            rowCopy.has_pst = value.includes("PST");
            props.setRowState(rowCopy);
        },
        [props.rowState, props.setRowState]
    )

    const handleFrequencyChange = useCallback(
        (value: string) => {
            let rowCopy = structuredClone(props.rowState);
            rowCopy.frequency = Frequency[value as keyof typeof Frequency]
            props.setRowState(rowCopy);
        },
        [props.rowState]
    )

    return (
        <div className={styles.row} key={props.baseKey}>

            <div className={`${styles.paramContainer} ${styles.dateContainer}`} key={`${props.baseKey}-date-container`}>
                <div className={styles.paramTitle} key={`${props.baseKey}-date-title`}>Date:</div>
                <Textbox className={styles.paramInput} onChangeCallback={(e, a) => handleDateChange(e.target.value)}
                    defaultValue={new Date().toLocaleDateString()} key={`${props.baseKey}-date-input`}/>
            </div>

            <div className={`${styles.paramContainer} ${styles.typeContainer}`} key={`${props.baseKey}-primetype-container`}>
                <div className={styles.paramTitle} key={`${props.baseKey}-primetype-title`}>Primary Type:</div>
                <Dropdown defaultIndex={0} baseKey={`${props.baseKey}-primetype-dropdown`}
                    values={props.types.map(x => x.primaryType.name)} callback={handlePrimaryTypeChange}></Dropdown>
            </div>

            <div className={`${styles.paramContainer} ${styles.typeContainer}`} key={`${props.baseKey}-subtype-container`}>
                <div className={styles.paramTitle} key={`${props.baseKey}-subtype-title`}>Sub Type:</div>
                <Dropdown defaultIndex={0} baseKey={`${props.baseKey}-subtype-dropdown`}
                    values={subTypes?.map(x => x.name)} callback={handleSubTypeChange}></Dropdown>
            </div>

            <div className={`${styles.paramContainer} ${styles.nameContainer}`} key={`${props.baseKey}-name-container`}>
                <div className={styles.paramTitle} key={`${props.baseKey}-name-title`}>Product Name:</div>
                <Textbox type="text" className={styles.paramInput} onChangeCallback={handleNameChange}/>
            </div>

            <div className={`${styles.paramContainer} ${styles.priceContainer}`} key={`${props.baseKey}-cost-container`}>
                <div className={styles.paramTitle} key={`${props.baseKey}-cost-title`}>Product Cost:</div>
                <Textbox onChangeCallback={handleCostChange} type="number" className={styles.paramInput}></Textbox>
            </div>

            {props.rowState.isRecurring ? '' : quantityBox(props.baseKey, handleQuantityChange)}

            <div className={`${styles.paramContainer} ${styles.taxContainer}`} key={`${props.baseKey}-tax-container`}>
                <div className={styles.paramTitle} key={`${props.baseKey}-cost-title`}>Product Tax Scheme:</div>
                <Dropdown className={styles.taxDropdown} defaultIndex={0} values={["GST & PST", "GST", "PST", "NONE"]} 
                    callback={(selectedValue: string, a: number, b: number) => handleTaxChange(selectedValue)} 
                    baseKey={`${props.baseKey}-tax-dropdown`}
                />
            </div>

            {props.rowState.isRecurring ? frequencyBox(props.baseKey, handleFrequencyChange, 
                Object.keys(Frequency).filter((item) => isNaN(Number(item))), Frequency.MONTHLY) : ''}

        </div>
    )
}