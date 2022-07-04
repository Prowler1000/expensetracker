import styles from '../styles/expenses.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, RecurringExpense, SingleExpense, SubType, Tax, SubtypesToPrimaryType, Prisma, RecurranceScheme} from 'prisma/prisma-client';
import { useState, useEffect } from 'react';
import { style } from '@mui/system';
import { IsDefined, StripUndefined } from '../lib/dry';
import IndividualExpense from '../components/individualexpense';
import { InternalRecurringExpense, InternalSingleExpense, PrimeTypeTotal, SerializableRecurringExpense, SerializableSingleExpense, SubTypeTotal } from '../lib/api-objects';
import PrimaryCategoryTotal from '../components/primecategoryoverview';

/*
    Server side data fetching
*/
export async function getServerSideProps(context: any) {
    let monthPrior = new Date(); // Will store the date of 1 month ago
    monthPrior.setMonth(monthPrior.getMonth() - 1);

    // Fetches single expenses that occured on or after monthPrior
    let dbSingleExpenses = await prisma.singleExpense.findMany({
        where: {
            date: {
                gte: monthPrior.toISOString()
            }
        }
    });
    let dbRecurringExpenses = await prisma.recurringExpense.findMany(); // Fetches all recurring expenses
    let dbTaxes = await prisma.tax.findMany();
    let dbPrimaryTypes = await prisma.primaryType.findMany();
    let dbSubTypes = await prisma.subType.findMany({
        include: {
            primaryTypes: true,
        }
    });

    // The actual props to be passed to render
    const props: ExpensesProps = {
        earliestDate: monthPrior.getTime(),
        singleExpenses: dbSingleExpenses.map(x => {
            let singleExpense: InternalSingleExpense = {
                date: x.date.getTime(),
                name: x.name,
                cost: x.cost,
                quantity: x.quantity,
                has_gst: x.has_gst,
                has_pst: x.has_pst,
                primaryType: StripUndefined(dbPrimaryTypes.find(p => p.id === x.primaryTypeId)),
                subType: StripUndefined(dbSubTypes.find(s => s.id === x.subTypeId)),
                taxRate: calcTaxRate(x, dbTaxes)
            }
            return singleExpense;
        }),
        recurringExpenses: dbRecurringExpenses.map(x => {
            const lastOccurance = getLastOccurance(x);
            let recurringExpense: InternalRecurringExpense = {
                date: x.dateStarted.getTime(),
                frequency: x.frequency,
                name: x.name,
                cost: x.cost,
                has_gst: x.has_gst,
                has_pst: x.has_pst,
                primaryType: StripUndefined(dbPrimaryTypes.find(p => p.id === x.primaryTypeId)),
                subType: StripUndefined(dbSubTypes.find(s => s.id === x.subTypeId)),
                taxRate: calcRecurringTaxRate(x, lastOccurance, dbTaxes),
                lastOccurance: lastOccurance.getTime(),
                nextOccurance: getNextOccurance(x, lastOccurance).getTime()
            }
            return recurringExpense;
        }),
        taxes: dbTaxes.map(x => {
            let tax: SerializableTax = {
                id: x.id,
                date: x.date.getMilliseconds(),
                pst: x.pst,
                gst: x.gst,
            }
            return tax;
        }),
        primaryTypes: dbPrimaryTypes,
        subTypes: dbSubTypes
    };
    return {props};
}


/*
    <---INTERFACES--->
*/

/**
    The props passed from server-side rendering
*/
interface ExpensesProps {
    earliestDate: number
    singleExpenses: InternalSingleExpense[],
    recurringExpenses: InternalRecurringExpense[],
    taxes: SerializableTax[],
    primaryTypes: PrimaryType[],
    subTypes: (SubType & {
        primaryTypes: SubtypesToPrimaryType[];
    })[]
}

/**
    Contains all data, plus some extras, of a Prisma RecurringExpense
    object in a json serializable format
*/

/**
    Contains all data, plus some extras, of a Prisma Tax
    object in a json serializable format
*/
interface SerializableTax {
    id: number,
    date: number,
    pst: number,
    gst: number
}

/*
    <---FUNCTIONS--->
*/

/** Calculates tax rate (as 1.x) for a SingleExpense. Returns 1.0 if no taxes applied */
function calcTaxRate( expense: SingleExpense, dbTaxes: Tax[]): number {
    let rate = 1.0;
    if (dbTaxes.length > 0) {
        let bestFit: Tax = dbTaxes[0];
        for (let i = 1; i < dbTaxes.length; i++){
            if (dbTaxes[i].date > expense.date) break;
            bestFit = dbTaxes[i];
        }
        if (expense.has_gst) rate += (bestFit.gst / 100);
        if (expense.has_pst) rate += (bestFit.pst / 100);
    }
    return rate;
}

/** Calculates tax rate (as 1.x) for a RecurringExpense. Returns 1.0 if no taxes applied */
function calcRecurringTaxRate(expense: RecurringExpense, lastOccurance: Date, dbTaxes: Tax[]): number {
    let rate = 1.0
    if (dbTaxes.length > 0) {
        let bestFit: Tax = dbTaxes[0];
        for (let i = 1; i < dbTaxes.length; i++){
            if (dbTaxes[i].date > lastOccurance) break;
            bestFit = dbTaxes[i];
        }
        if (expense.has_gst) rate += (bestFit.gst / 100);
        if (expense.has_pst) rate += (bestFit.pst / 100);
    }
    return rate;
}

/** Gets the number of days in the month given. I honestly don't know how this works */
function daysInMonth(month: number) {
    if (month < 0) month = 11;
    var now = new Date();
    return new Date(now.getFullYear(), month+1, 0).getDate();
}

/** Gets the last time a RecurringExpense occured. As of writing, function is incomplete */
function getLastOccurance(expense: RecurringExpense): Date {
    // I made the mistake of using this object as the current date. Changing this will require further changes
    let lastOccurance = new Date(); // Object to store when the last occurance was
    if (expense.frequency === RecurranceScheme.DAILY) {
        // Shouldn't do anything, it happens every day
    } 
    else if (expense.frequency === RecurranceScheme.WEEKLY) {
        let curDayOfWeek = new Date().getDay();
        if (expense.dateStarted.getDay() <= curDayOfWeek){
            const dayDifference = curDayOfWeek - expense.dateStarted.getDay();
            lastOccurance.setDate(lastOccurance.getDate() - dayDifference);
        }
    } 
    else if (expense.frequency === RecurranceScheme.BIWEEKLY) {
        const intervals_since = Math.floor(
            (lastOccurance.getTime() - expense.dateStarted.getTime())
            / 1209600000)
        lastOccurance = new Date(expense.dateStarted.getTime() + (intervals_since * 1209600000))
    } 
    else if (expense.frequency === RecurranceScheme.MONTHLY) {
        let expenseDayOfMonth = expense.dateStarted.getDate();
        let curDayOfMonth = new Date().getDate();
        let daysInCurMonth = daysInMonth(new Date().getMonth());
        if (expenseDayOfMonth === curDayOfMonth) {
            // Set last occurance to today
            lastOccurance.setDate(curDayOfMonth);
        }
        else if (expenseDayOfMonth > curDayOfMonth && !(expenseDayOfMonth > daysInCurMonth)) {
            // Set last occurance to sometime last month
            const prevMonth = new Date().getMonth() - 1;
            const daysInPrevMonth = daysInMonth(prevMonth);
            if (daysInPrevMonth < expenseDayOfMonth) {
                lastOccurance.setMonth(prevMonth, daysInPrevMonth);
            }
            else {
                lastOccurance.setMonth(prevMonth, expenseDayOfMonth);
            }
        } 
        else if (expenseDayOfMonth < curDayOfMonth) {
            // Set last occurance to a previous day this month
            lastOccurance.setDate(expenseDayOfMonth);
        }
        else if (expenseDayOfMonth > daysInCurMonth && curDayOfMonth === daysInCurMonth) {
            // Set last day of month
            lastOccurance.setDate(daysInCurMonth);
        }
    } 
    else if (expense.frequency === RecurranceScheme.QUARTERLY) {
        console.log("ERROR: NOT IMPLEMENTED")
        lastOccurance = new Date(0)
    } 
    else if (expense.frequency === RecurranceScheme.SEMIANNUALLY) {
        console.log("ERROR: NOT IMPLEMENTED")
        lastOccurance = new Date(0)
    } 
    else if (expense.frequency === RecurranceScheme.ANNUALLY) {
        console.log("ERROR: NOT IMPLEMENTED")
        lastOccurance = new Date(0)
    }
    return new Date(lastOccurance.toDateString()); // Retuns last occurance, stripping time element
}

/** Gets the next time a RecurringExpense should occur. !!!Doesn't work right, issues with monthly for sure */
function getNextOccurance(expense: RecurringExpense, lastOccurance: Date): Date {
    ///!!! CHANGE TO SWITCH/CASE! THIS IS IMPOSSIBLE TO READ
    let nextOccurance = new Date(lastOccurance.toDateString());
    if (expense.frequency === RecurranceScheme.DAILY) {
        nextOccurance.setDate(nextOccurance.getDate() + 1);
    } else if (expense.frequency === RecurranceScheme.WEEKLY) {
        nextOccurance.setDate(nextOccurance.getDate() + 7);
    } else if (expense.frequency === RecurranceScheme.BIWEEKLY) {
        nextOccurance.setDate(nextOccurance.getDate() + 14);
    } else if (expense.frequency === RecurranceScheme.MONTHLY) {
        nextOccurance.setMonth(nextOccurance.getMonth() + 1);
    } else if (expense.frequency === RecurranceScheme.QUARTERLY) {
        nextOccurance.setMonth(nextOccurance.getMonth() + 3);
    } else if (expense.frequency === RecurranceScheme.SEMIANNUALLY) {
        nextOccurance.setMonth(nextOccurance.getMonth() + 6);
    } else if (expense.frequency === RecurranceScheme.ANNUALLY) {
        nextOccurance.setFullYear(nextOccurance.getFullYear() + 1);
    }
    return nextOccurance;
}

/** Totals up passed array of single expenses */
function totalSingleExpenses(expenses: InternalSingleExpense[]): number {
    let total = 0.0;
    expenses.forEach(expense => 
        total += (expense.cost * expense.taxRate)
    );
    return total;
}
/** Totals up passed array of recurring expenses */
function totalRecurringExpenses(expenses: InternalRecurringExpense[], fromDate: number): number {
    let total = 0.0;
    expenses.forEach(expense =>{
        if (expense.lastOccurance >= fromDate)
            total += (expense.cost * expense.taxRate)
    })
    return total;
}
/** Adds total cost of each expense to appropriate type total */
function typeTotalSingleExpenses(expenses: InternalSingleExpense[], pTypes: PrimeTypeTotal[], sTypes?: SubTypeTotal[]) {
    expenses.forEach(expense => {
        let pTypeTotal = pTypes.find(x => x.type.id === expense.primaryType.id);
        let sTypeTotal = sTypes?.find(x => x.primaryType?.id === expense.primaryType.id && x.subType.id === expense.subType.id);
        if (pTypeTotal) pTypeTotal.total += (expense.cost * expense.taxRate);
        if (sTypeTotal) sTypeTotal.total += (expense.cost * expense.taxRate);
    }) 
}
/** Adds total cost of each expense to appropriate type total */
function typeTotalRecurringExpense(expenses: InternalRecurringExpense[], fromDate: number, pTypes: PrimeTypeTotal[], sTypes?: SubTypeTotal[]) {
    expenses.forEach(expense => {
        if (expense.lastOccurance >= fromDate){
            let pTypeTotal = pTypes.find(x => x.type.id === expense.primaryType.id);
            let sTypeTotal = sTypes?.find(x => x.primaryType?.id === expense.primaryType.id && x.subType.id === expense.subType.id);
            if (pTypeTotal) pTypeTotal.total += (expense.cost * expense.taxRate);
            if (sTypeTotal) sTypeTotal.total += (expense.cost * expense.taxRate);
        }
    }) 
}


function Expenses(props: ExpensesProps) {
    const initialFromDate = () => {
        return new Date(props.earliestDate);
    }
    const initialSingleExpenses = () => {
        return props.singleExpenses;
    }
    const initialRecurringExpenses = () => {
        return props.recurringExpenses;
    }
    const initialTaxes = () => {
        return props.taxes;
    }
    const initialPrimaryTypes = () => {
        return props.primaryTypes;
    }
    const initialSubTypes = () => {
        return props.subTypes;
    }
    const initialShowSubCategories = () => {
        let tmpArray: boolean[] = [];
        for (let i in primaryTypes) {
            tmpArray[i] = false;
        }
        return tmpArray;
    }
    const initialInvidualExpenses = () => {
        const tmp: {element: JSX.Element, date: Date}[] = [];
        return tmp;
    }

    // States used for rendering and computations.
    const [fromDate, setFromDate] = useState(initialFromDate);
    const [singleExpenses, setSingleExpenses] = useState(initialSingleExpenses);
    const [recurringExpenses, setRecurringExpenses] = useState(initialRecurringExpenses);
    const [taxes, setTaxes] = useState(initialTaxes);
    const [primaryTypes, setPrimaryTypes] = useState(initialPrimaryTypes);
    const [subTypes, setSubTypes] = useState(initialSubTypes);
    const [indivialExpenses, setIndividualExpenses] = useState(initialInvidualExpenses);

    useEffect(() => {
        function generateIndividualExpenses() {
            let array: {element: JSX.Element, date: Date}[] = [];
            let counter = 0;
            singleExpenses.forEach(x => {
                const entry: {element: JSX.Element, date: Date} = {
                    element: 
                    <IndividualExpense baseKey={`indiv-exp-${counter}`}
                        expense={x}/>,
                    date: new Date(x.date)
                }
                array.push(entry);
                counter++;
            })
            recurringExpenses.forEach(x => {
                const entry: {element: JSX.Element, date: Date} = {
                    element: 
                    <IndividualExpense baseKey={`indiv-exp-${counter}`}
                        expense={x}/>,
                    date: new Date(x.lastOccurance)
                }
                array.push(entry);
                counter++;
            })
            array.sort((a, b) => {return (b.date.getTime() - a.date.getTime())})
            return array;
        }
        setIndividualExpenses(generateIndividualExpenses())
    }, [recurringExpenses, singleExpenses])

    // Absolute total of all purchases
    const absoluteTotal = (totalSingleExpenses(singleExpenses) 
        + totalRecurringExpenses(recurringExpenses, fromDate.getTime())).toFixed(2);
    
    let primaryCategorizedTotals: PrimeTypeTotal[] = primaryTypes.map((type, index) => {
        const pTypeTotal: PrimeTypeTotal = {
            type: type,
            total: 0.0
        }
        return pTypeTotal;
    });
    let subCategorizedTotals: SubTypeTotal[] = []
    subTypes.forEach(type => {
        type.primaryTypes.forEach((typeMap) => {
            const subTypeTotal: SubTypeTotal = {
                primaryType: primaryTypes.find(x => x.id === typeMap.primaryTypeId),
                subType: type,
                total: 0,
            }
            subCategorizedTotals.push(subTypeTotal)
        })
    })

    // Add recent expenses into their appropriate category totals
    typeTotalSingleExpenses(singleExpenses, primaryCategorizedTotals, subCategorizedTotals);
    typeTotalRecurringExpense(recurringExpenses, fromDate.getTime(), primaryCategorizedTotals, subCategorizedTotals);
    let maxRows = 0;
    primaryCategorizedTotals.forEach(p => 
        maxRows = Math.max(maxRows,
            subCategorizedTotals.filter(s => s.primaryType?.id === p.type.id).length))
    
    return (
        <div className={styles.container}>
            <div className={styles.overview}>
                <div className={styles.overviewTotal}>
                    <div className={styles.overviewTotalTitle}>Expenses since <a>{fromDate.toDateString()}</a>:</div>
                    <div className={styles.overviewTotalValue}>${absoluteTotal}</div>
                </div>
                <div className={styles.categorizedTotals}>
                    {primaryCategorizedTotals.map((primeType, index) => {
                        return (
                            <PrimaryCategoryTotal 
                                baseKey={`category-container-${index}`}
                                primaryTotal={primeType}
                                subTypeTotals={subCategorizedTotals.filter(x => x.primaryType?.id === primeType.type.id)}
                                totalRows={maxRows}
                            />)
                    })}
                </div>
                <div className={styles.listedExpenses}>
                    {indivialExpenses.map(x => {
                        return x.element;
                    })}
                </div>
            </div>
        </div>
    )
}


export default Expenses;