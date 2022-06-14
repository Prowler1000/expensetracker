import styles from '../styles/addrecurring.module.css';
import prisma from '../lib/prisma';
import { PrimaryType, Prisma, SubType, SubtypesToPrimaryType } from 'prisma/prisma-client';
import { type } from 'os';

interface AddRecurringProps {
    typeMaps: TypeMap[],
}

interface TypeMap {
    primaryType: PrimaryType,
    subTypes: SubType[],
}

export async function getServerSideProps(context) {
    const dbPrimaryTypes = await prisma.primaryType.findMany({
        include: {
            subTypes: true,
        }
    });
    const dbSubTypes = await prisma.subType.findMany();

    // Create type maps (I really need to get better at naming things..)
    let typeMaps: TypeMap[] = []; // Create object to be sent as prop
    dbPrimaryTypes.forEach((primeType, index) => {
        const subTypes = primeType.subTypes.map(x => dbSubTypes.find(sub => sub.id === x.subTypeId));
        const filteredSubTypes: SubType[] = subTypes.filter(x => x); // Should filter anything that is null or undefined. Ignoring TS warning.
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

function AddRecurring(props: AddRecurringProps) {
    console.log (props);
}

export default AddRecurring;