import { PrimaryType, SingleExpense, SubType, Tax } from 'prisma/prisma-client'
import styles from '../styles/testing.module.css'
import prisma from '../lib/prisma';
import Dropdown from '../components/dropdown';
import Textbox from '../components/textbox';

export async function getServerSideProps(context: any) {
    const purchases: SingleExpense[] = await prisma.singleExpense.findMany()
    const taxes: Tax[] = await prisma.tax.findMany()
    const primaryTypes: PrimaryType[] = await prisma.primaryType.findMany()
    const subTypes: SubType[] = await prisma.subType.findMany()
    return { 
        props: { 
            purchases: purchases,
            taxes: taxes,
            primaryTypes: primaryTypes,
            subTypes: subTypes,
        }
    }
}

export default function Testing() {
    let someRef;
    const test = <Dropdown values={["Value 1", "Value 2", "Value 3", "Value 4"]} baseKey="0"></Dropdown>
    console.log(styles.container);
    return(
        <div className={styles.container}>
            <div>Space taker!</div>
            <Textbox type="number"></Textbox>
        </div>
    )
}