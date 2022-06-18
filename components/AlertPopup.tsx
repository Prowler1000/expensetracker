import styles from './styles/alertpopup.module.css'
import { useEffect } from 'react';
import { Info } from '@mui/icons-material';

interface AlertPopupProps {
    top: number,
    left: number,
    alertText: string,
    timeout?: {time: number, callback: () => void},
}

function AlertPopup(props: AlertPopupProps) {

    useEffect(() => {
        if (props.timeout) {
            const timeId = setTimeout(() => {
                props.timeout?.callback();
            }, props.timeout.time * 1000)

            return () => {
                clearTimeout(timeId)
            }
        }
    })
    
    return (
        <div className={styles.container} style={{top: `${props.top}px`, left: `${props.left}px`}}>
            <Info className={styles.info}/>
            <div className={styles.alertText}>
                {props.alertText}
            </div>
        </div>
    )
}

export default AlertPopup;