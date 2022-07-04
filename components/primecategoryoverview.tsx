import styles from './styles/primecatoverview.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, RecurringExpense, SingleExpense, SubType, Tax, SubtypesToPrimaryType, Prisma, RecurranceScheme} from 'prisma/prisma-client';
import { useState, useEffect } from 'react';
import { style } from '@mui/system';
import { IsDefined, StripUndefined } from '../lib/dry';
import IndividualExpense from '../components/individualexpense';
import { InternalRecurringExpense, InternalSingleExpense, PrimeTypeTotal, SerializableRecurringExpense, SerializableSingleExpense, SubTypeTotal } from '../lib/api-objects';

interface PrimaryCategoryTotalProps {
    baseKey: string,
    primaryTotal: PrimeTypeTotal,
    subTypeTotals: SubTypeTotal[],
    totalRows?: number
}

const subTypeRows = (subTypeTotals: SubTypeTotal[], baseKey: string, minRows?: number) => {
    const extraRows = IsDefined(minRows) ? minRows - subTypeTotals.length : 0
    let rows: JSX.Element[] = [];
    const row = (categoryName: string, categoryTotal: number, index: number, isFiller: boolean) => {
        let subBaseKey = `${baseKey}-${index}-sub-category`;
        return (
        <div className={`${styles.subTypeContainer} ${isFiller ? styles.fillerRow : ''}`} key={subBaseKey}>
            <div className={styles.subTypeTitle} key={`${subBaseKey}-title`}>
                {categoryName}:
            </div>
            <div className={styles.subTypeValue} key={`${subBaseKey}-value`}>
                ${categoryTotal.toFixed(2)}
            </div>
        </div>
        )
    }
    subTypeTotals.forEach(type => {
        rows.push(row(type.subType.name, type.total, rows.length, false))
    })
    console.log(minRows);
    for (let i = 0; i < extraRows; i++) {
        rows.push(row("Filler", 0, rows.length, true))
    }
    return rows;
}

export default function PrimaryCategoryTotal(props: PrimaryCategoryTotalProps) {
    const [showSubTotals, setShowSubTotals] = useState(true);

    return (
        <div className={styles.container} key={props.baseKey}>

            <div className={styles.primaryTotal} key={`${props.baseKey}-primary-container`}>
                <div className={styles.primaryTitle} key={`${props.baseKey}-primary-title`}>
                    {props.primaryTotal.type.name}:
                </div>
                <div className={styles.primaryTotalValue} key={`${props.baseKey}-primary-value`}>
                    ${props.primaryTotal.total.toFixed(2)}
                </div>
            </div>

            <div className={showSubTotals ? styles.subTotalsContainer : styles.displayNone} key={`${props.baseKey}-sub-container`}>
                {subTypeRows(props.subTypeTotals, `${props.baseKey}-sub-category`, props.totalRows)}
            </div>

        </div>
    )
}