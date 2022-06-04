import styles from './styles/page.module.css';

export default function Page(props: any){
    return (
        <div className={styles.page}>
            {props.children}
        </div>
    )
}