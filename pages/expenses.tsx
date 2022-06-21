import styles from '../styles/expenses.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, RecurringExpense, SingleExpense, SubType, Tax, SubtypesToPrimaryType, Prisma, RecurranceScheme} from 'prisma/prisma-client';
import { useState } from 'react';
import { style } from '@mui/system';

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
            let singleExpense: SerializableSingleExpense = {
                id: x.id,
                date: x.date.getTime(),
                name: x.name,
                cost: x.cost,
                quantity: x.quantity,
                has_gst: x.has_gst,
                has_pst: x.has_pst,
                primaryTypeId: x.primaryTypeId,
                subTypeId: x.subTypeId,
                taxRate: calcTaxRate(x, dbTaxes)
            }
            return singleExpense;
        }),
        recurringExpenses: dbRecurringExpenses.map(x => {
            const lastOccurance = getLastOccurance(x);
            let recurringExpense: SerializableRecurringExpense = {
                id: x.id,
                dateStarted: x.dateStarted.getTime(),
                frequency: x.frequency,
                name: x.name,
                cost: x.cost,
                has_gst: x.has_gst,
                has_pst: x.has_pst,
                primaryTypeId: x.primaryTypeId,
                subTypeId: x.subTypeId,
                taxRate: calcRecurringTaxRate(x, lastOccurance, dbTaxes),
                lastOccuranceDate: lastOccurance.getTime(),
                nextOccuranceDate: getNextOccurance(x, lastOccurance).getTime()
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
    singleExpenses: SerializableSingleExpense[],
    recurringExpenses: SerializableRecurringExpense[],
    taxes: SerializableTax[],
    primaryTypes: PrimaryType[],
    subTypes: (SubType & {
        primaryTypes: SubtypesToPrimaryType[];
    })[]
}

/**
    Contains all data, plus some extras, of a Prisma SingleExpense
    object in a json serializable format
*/
interface SerializableSingleExpense {
    id: number,
    date: number,
    name: string,
    cost: number,
    quantity: number,
    has_gst: boolean,
    has_pst: boolean,
    primaryTypeId: number,
    subTypeId: number,
    taxRate: number,
}

/**
    Contains all data, plus some extras, of a Prisma RecurringExpense
    object in a json serializable format
*/
interface SerializableRecurringExpense {
    id: number,
    dateStarted: number,
    dateEnded?: number,
    lastOccuranceDate: number,
    nextOccuranceDate: number,
    frequency: RecurranceScheme,
    name: string,
    cost: number,
    has_gst: boolean,
    has_pst: boolean,
    primaryTypeId: number,
    subTypeId: number,
    taxRate: number,
}

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

/**
    For adding totals of primary types
*/
interface PrimeTypeTotal {
    type: PrimaryType,
    total: number
}

/**
    For adding totals of sub types with the ability
    to add relevant primary type
*/
interface SubTypeTotal {
    primaryType?: PrimaryType,
    subType: SubType,
    total: number
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
        // Gotta figure this out!
        console.error("Haven't implemented bi-weekly stuff yet!");
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
        
    } 
    else if (expense.frequency === RecurranceScheme.SEMIANNUALLY) {

    } 
    else if (expense.frequency === RecurranceScheme.ANNUALLY) {

    }
    return new Date(lastOccurance.toDateString()); // Retuns last occurance, stripping time element
}

/** Gets the next time a RecurringExpense should occur */
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
function totalSingleExpenses(expenses: SerializableSingleExpense[]): number {
    let total = 0.0;
    expenses.forEach(expense => 
        total += (expense.cost * expense.taxRate)
    );
    return total;
}
/** Totals up passed array of recurring expenses */
function totalRecurringExpenses(expenses: SerializableRecurringExpense[], fromDate: number): number {
    let total = 0.0;
    expenses.forEach(expense =>{
        if (expense.lastOccuranceDate >= fromDate)
            total += (expense.cost * expense.taxRate)
    })
    return total;
}
/** Adds total cost of each expense to appropriate type total */
function typeTotalSingleExpenses(expenses: SerializableSingleExpense[], pTypes: PrimeTypeTotal[], sTypes?: SubTypeTotal[]) {
    expenses.forEach(expense => {
        let pTypeTotal = pTypes.find(x => x.type.id === expense.primaryTypeId);
        let sTypeTotal = sTypes?.find(x => x.primaryType?.id === expense.primaryTypeId && x.subType.id === expense.subTypeId);
        if (pTypeTotal) pTypeTotal.total += (expense.cost * expense.taxRate);
        if (sTypeTotal) sTypeTotal.total += (expense.cost * expense.taxRate);
    }) 
}
/** Adds total cost of each expense to appropriate type total */
function typeTotalRecurringExpense(expenses: SerializableRecurringExpense[], fromDate: number, pTypes: PrimeTypeTotal[], sTypes?: SubTypeTotal[]) {
    expenses.forEach(expense => {
        if (expense.lastOccuranceDate >= fromDate){
            let pTypeTotal = pTypes.find(x => x.type.id === expense.primaryTypeId);
            let sTypeTotal = sTypes?.find(x => x.primaryType?.id === expense.primaryTypeId && x.subType.id === expense.subTypeId);
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

    // States used for rendering and computations.
    const [fromDate, setFromDate] = useState(initialFromDate);
    const [singleExpenses, setSingleExpenses] = useState(initialSingleExpenses);
    const [recurringExpenses, setRecurringExpenses] = useState(initialRecurringExpenses);
    const [taxes, setTaxes] = useState(initialTaxes);
    const [primaryTypes, setPrimaryTypes] = useState(initialPrimaryTypes);
    const [subTypes, setSubTypes] = useState(initialSubTypes);
    const [showSubCategories, setShowSubCategories] = useState(initialShowSubCategories);

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

    /**
        Toggles each sub category. Originally each sub cat was supposed to be positioned absolutely
        to allow for nice animations but that got complicated and I just never ended up doing it.
    */
    function toggleShowSubCategories(event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) {
        let showSubCategoriesCopy = [...showSubCategories];
        showSubCategoriesCopy[index] = !showSubCategoriesCopy[index];
        setShowSubCategories(showSubCategoriesCopy);
        const doDisplay = showSubCategoriesCopy[index];


        const spacer = document.getElementById(`${index}-spacer`);
        const subCats = document.getElementById(`${index}-subCategories`);
        const primeCatValue = document.getElementById(`${index}-primeCatValue`);
        const rect = primeCatValue ? primeCatValue.getClientRects()[0] : event.currentTarget.getClientRects()[0];

        if (subCats) {
            subCats.style.top = `${rect.bottom.toFixed(0)}px`;
        }
    }

    /** React object to show the total of a primary type with its relevant sub types */
    const PrimaryCategoryTotal = (primeType: PrimeTypeTotal, subTypes: SubTypeTotal[], index: number) => {
        let baseKey = `${primeType.type.id}-${index}`;
        //if (index > 0) return (<div></div>)
        return (
            <div className={styles.primaryCategoryContainer} key={baseKey}>

                <div className={styles.primaryOverviewContainer} key={`${baseKey}-primeOverviewContainer`}  onClick={(e) => toggleShowSubCategories(e, index)}>
                    <div className={styles.primaryCategoryTitle} key={`${baseKey}-title`}>
                        {primeType.type.name}:
                    </div>
                    <div className={styles.primaryCategoryValue} key={`${baseKey}-value`} id={`${index}-primeCatValue`}>
                        ${primeType.total.toFixed(2)}
                    </div>
                </div>

                <div className={`${styles.subCategorySpacer}`} key={`${baseKey}-subSpacer`} id={`${index}-spacer`}/>
                <div className={showSubCategories[index] ? styles.subCategoriesContainer : styles.displayNone} key={`${baseKey}-subCat`} id={`${index}-subCategories`}>
                    {subTypes.map((type,index) => {
                        let subBaseKey = `${baseKey}-${index}-subCats`;
                        return (
                            <div className={styles.subCategoryContainer} key={subBaseKey}>
                                <div className={styles.subCategoryTitle} key={`${subBaseKey}-title`}>
                                    {type.subType.name}:
                                </div>
                                <div className={styles.subCategoryValue} key={`${subBaseKey}-value`}>
                                    ${type.total.toFixed(2)}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    
    return (
        <div className={styles.container}>
            <div className={styles.overview}>
                <div className={styles.overviewTotal}>
                    <div className={styles.overviewTotalTitle}>Expenses since <a>{fromDate.toDateString()}</a>:</div>
                    <div className={styles.overviewTotalValue}>${absoluteTotal}</div>
                </div>
                <div className={styles.categorizedTotals}>
                    {primaryCategorizedTotals.map((primeType, index) => {
                        return PrimaryCategoryTotal(primeType, 
                            subCategorizedTotals.filter(x => x.primaryType?.id === primeType.type.id),
                            index)
                    })}
                </div>
                <div className={styles.listedExpenses}>

                </div>
            </div>
        </div>
    )
}


export default Expenses;