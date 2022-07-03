import styles from './styles/navbar.module.css'
import Link from 'next/link'

function Navbar(props: any) {
    return (
        <div className={styles.container}>
            <div className={styles.bar}>
                <div className={styles.buttons}>
                    <Link href="/expenses">Expenses</Link>
                    <Link href="/add/single-expense">Add Single Expense</Link>
                    <Link href="/add/recurring-expense">Add Recurring Expense</Link>
                </div>
            </div>
        </div>
    )
}

export default Navbar;