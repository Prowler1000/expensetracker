import styles from '../styles/expenses.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, RecurringExpense, SingleExpense, SubType } from 'prisma/prisma-client';

export async function getServerSideProps(context) {
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
    let dbPrimaryTypes = await prisma.primaryType.findMany()
    let dbSubTypes = await prisma.subType.findMany()

    const props: ExpensesProps = {
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
                subTypeId: x.subTypeId
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
    singleExpenses: SerializableSingleExpense[],
    taxes: SerializableTax[],
    primaryTypes: PrimaryType[],
    subTypes: SubType[]
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
}
interface SerializableTax {
    id: number,
    date: number,
    pst: number,
    gst: number
}

function Expenses(props: ExpensesProps) {
    console.log(props);

    return (
        <div className={styles.container}>
            
        </div>
    )
}

export default Expenses;