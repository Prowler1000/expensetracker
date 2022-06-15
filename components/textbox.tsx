import styles from './styles/textbox.module.css'
import React, { ChangeEvent } from 'react';
import { useState } from 'react';
import AlertPopup from './AlertPopup';

interface TextboxProps {
    defaultValue?: string,
    type?: string,
    className?: string,
    id?: string,
    baseKey?: string,
    index?: number,
    onChangeCallback?: (arg0: ChangeEvent<HTMLInputElement>, arg1: number) => void;
}

function Textbox(props: TextboxProps) {
    const setInitialValue = () => {
        return props.defaultValue ? props.defaultValue : '';
    }
    const setInitialPopupLocation = () => {
        return {top: 0, left: 0}
    }
    const setInitialShowPopup = () => {
        return false;
    }
    const setInitialValidCharacters = () => {
        let validCharacters;
        if (props.type === 'number') {
            validCharacters = ['1','2','3','4','5','6','7','8','9','0','.', '', '\b'];
        } else {
            validCharacters = null;
        }
        return validCharacters;
    }

    const [value, setValue] = useState(setInitialValue);
    const [popupLocation, setPopupLocation] = useState(setInitialPopupLocation)
    const [showPopup, setShowPopup] = useState(setInitialShowPopup);
    const [validCharacters, setValidCharacters] = useState(setInitialValidCharacters);

    async function handleChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.value.length > 0 && validCharacters &&
            !validCharacters.includes(event.target.value[event.target.value.length - 1])) {
                var tmp = event.target.value.split('');
                tmp.splice(-1);
                event.target.value = tmp.join('');

                const rect = event.target.getBoundingClientRect();
                setPopupLocation({top: rect.bottom + 4, left: rect.left + 4});
                setShowPopup(true)
        }
        else if (showPopup) {
            setShowPopup(false);
        }
        setValue(event.target.value);
        if (props.onChangeCallback) props.onChangeCallback(event, props.index ? props.index : 0);
        event.preventDefault();
    }

    function unrenderAlertBox() {
        setShowPopup(false);
    }

    return (
        <div className={`${styles.container} ${props.className}`}>
            <input className={styles.input} onChange={handleChange} value={value}></input>
            { showPopup ?
                <AlertPopup top={popupLocation.top} left={popupLocation.left} alertText="Please only enter a valid number or '.'"
                    timeout={{time: 7, callback: unrenderAlertBox}}></AlertPopup> :
                <div/>}
        </div>
    )
}

export default Textbox;