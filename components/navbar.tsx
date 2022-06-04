import styles from './styles/navbar.module.css'
import Link from 'next/link'

function Navbar(props: any) {
    return (
        <div className={styles.container}>
            <div className={styles.bar}>
                <div className={styles.buttons}>
                    <Link href="/">Home</Link>
                    <Link href="/add">Add Expenditure</Link>
                    <Link href="/expenses">Expenses</Link>
                    <Link href="/testing">Testing Page</Link>
                </div>
            </div>
        </div>
    )
}

export default Navbar;