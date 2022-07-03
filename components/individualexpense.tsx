import styles from './styles/individualexpense.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, RecurringExpense, SingleExpense, SubType, Tax, SubtypesToPrimaryType, Prisma, RecurranceScheme} from 'prisma/prisma-client';
import { useState, useEffect } from 'react';
import { style } from '@mui/system';
import { IsDefined } from '../lib/dry';
import { InternalRecurringExpense, InternalSingleExpense } from '../lib/api-objects';

interface IndividualExpenseProps {
    baseKey: string,
    expense: InternalSingleExpense | InternalRecurringExpense
}

export default function IndividualExpense(props: IndividualExpenseProps) {
    const expenseDate = 'lastOccurance' in props.expense ? props.expense.lastOccurance : props.expense.date

    return (
        <div className={styles.container} key={props.baseKey}>
            <div className={styles.date} key={`${props.baseKey}-date`}>
                {new Date(expenseDate).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                })}
            </div>
            <div className={styles.name} key={`${props.baseKey}-name`}>
                {props.expense.name}
            </div>
            <div className={styles.cost} key={`${props.baseKey}-cost`}>
                ${(props.expense.cost * props.expense.taxRate).toFixed(2)}
            </div>
            <div className={styles.quantity} key={`${props.baseKey}-quantity`}>
                {
                    'quantity' in props.expense ?
                        `Quantity: ${props.expense.quantity}` :
                        <div className={styles.centerTextQuantity} key={`${props.baseKey}-quantity-center`}>
                            N/A
                        </div>
                }
            </div>
            <div className={styles.taxRate} key={`${props.baseKey}-tax`}>
                Tax Rate: {((props.expense.taxRate - 1)*100).toFixed(0)}%
            </div>
            <div className={styles.frequency} key={`${props.baseKey}-frequency`}>
                {
                    'frequency' in props.expense ?
                        `Frequency: ${props.expense.frequency}` :
                        <div className={styles.centerTextFrequency} key={`${props.baseKey}-frequency-center`}>
                            N/A
                        </div>
                }
            </div>
            <div className={styles.frequency} key={`${props.baseKey}-next`}>
                {
                    'nextOccurance' in props.expense ?
                        `Next Occurance: ${new Date(props.expense.nextOccurance).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })}` :
                        <div className={styles.centerTextNext} key={`${props.baseKey}-next-center`}>
                            N/A
                        </div>
                }
            </div>
            
        </div>
    )
}