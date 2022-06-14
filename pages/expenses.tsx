import styles from '../styles/expenses.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, RecurringExpense, SingleExpense, SubType, Tax, SubtypesToPrimaryType} from 'prisma/prisma-client';
import { useState } from 'react';
import { style } from '@mui/system';

export async function getServerSideProps(context) {
    console.log(typeof context);
    let monthPrior = new Date();
    monthPrior.setMonth(monthPrior.getMonth() - 1);

    let dbSingleExpenses = await prisma.singleExpense.findMany({
        where: {
            date: {
                gte: monthPrior.toISOString()
            }
        }
    });
    let dbTaxes = await prisma.tax.findMany();
    let dbPrimaryTypes = await prisma.primaryType.findMany();
    let dbSubTypes = await prisma.subType.findMany({
        include: {
            primaryTypes: true,
        }
    });

    function calcTaxRate( expense: SingleExpense): number {
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

    const props: ExpensesProps = {
        earliestDate: monthPrior.getTime(),
        singleExpenses: dbSingleExpenses.map(x => {
            let singleExpense: SerializableSingleExpense = {
                id: x.id,
                date: x.date.getMilliseconds(),
                name: x.name,
                cost: x.cost,
                quantity: x.quantity,
                has_gst: x.has_gst,
                has_pst: x.has_pst,
                primaryTypeId: x.primaryTypeId,
                subTypeId: x.subTypeId,
                taxRate: calcTaxRate(x)
            }
            return singleExpense;
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

interface ExpensesProps {
    earliestDate: number
    singleExpenses: SerializableSingleExpense[],
    taxes: SerializableTax[],
    primaryTypes: PrimaryType[],
    subTypes: (SubType & {
        primaryTypes: SubtypesToPrimaryType[];
    })[]
}

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
interface SerializableTax {
    id: number,
    date: number,
    pst: number,
    gst: number
}

interface PrimeTypeTotal {
    type: PrimaryType,
    total: number
}

interface SubTypeTotal {
    primaryType?: PrimaryType,
    subType: SubType,
    total: number
}

function Expenses(props: ExpensesProps) {
    const initialFromDate = () => {
        return new Date(props.earliestDate);
    }
    const initialSingleExpenses = () => {
        return props.singleExpenses;
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

    const [fromDate, setFromDate] = useState(initialFromDate);
    const [singleExpenses, setSingleExpenses] = useState(initialSingleExpenses);
    const [taxes, setTaxes] = useState(initialTaxes);
    const [primaryTypes, setPrimaryTypes] = useState(initialPrimaryTypes);
    const [subTypes, setSubTypes] = useState(initialSubTypes);
    const [showSubCategories, setShowSubCategories] = useState(initialShowSubCategories);

    let absoluteTotalNumber = 0.0;
    singleExpenses.forEach(expense => {
        absoluteTotalNumber += (expense.cost * expense.taxRate)
    });
    const absoluteTotal= absoluteTotalNumber.toFixed(2);

    let primaryCategorizedTotals: PrimeTypeTotal[] = [];
    let subCategorizedTotals: SubTypeTotal[] = [];
    primaryTypes.forEach((type, index) => {
        primaryCategorizedTotals[index] = {
            type: type,
            total: 0.0
        }
    })
    subTypes.forEach((type, index) => {
        type.primaryTypes.forEach((typeMap) => {
            const subTypeTotal: SubTypeTotal = {
                primaryType: primaryTypes.find(x => x.id === typeMap.primaryTypeId),
                subType: type,
                total: 0,
            }
            subCategorizedTotals.push(subTypeTotal)
        })
    })
    singleExpenses.forEach((expense, index) => {
        let pTypeTotal = primaryCategorizedTotals.find(x => x.type.id === expense.primaryTypeId);
        let sTypeTotal = subCategorizedTotals.find(x => x.primaryType.id === expense.primaryTypeId && x.subType.id === expense.subTypeId);
        if (pTypeTotal) pTypeTotal.total += (expense.cost * expense.taxRate);
        if (sTypeTotal) sTypeTotal.total += (expense.cost * expense.taxRate);
    })

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
                            subCategorizedTotals.filter(x => x.primaryType.id === primeType.type.id),
                            index)
                    })}
                </div>
            </div>
        </div>
    )
}


export default Expenses;