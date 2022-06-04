import styles from './styles/dropdown.module.css'
import { useEffect, useRef, useState } from 'react'

interface DropdownProps {
    values: string[],
    sort?: boolean,
    reverseSort?: boolean,
    callback?: (arg0: {
        selectedValue: string; selectedIndex: number
    }) => void,
    defaultIndex?: number,
    baseKey: string,
    index?: number,
    className?: string,
}

export default function Dropdown(props: DropdownProps){
    // Function to initially copy and sort the array. If we don't want to render
    // the selected value, that should be done during render and not a re-sort
    const initialSortValues = () => {
        let copyValues = props.values.slice().map((value, index) => {
            return {value: value, index: index}
        })
        if (props.sort && !props.reverseSort){
            copyValues.sort((a,b) => {
                return a.value.localeCompare(b.value);
            })
        } 
        else if (props.reverseSort) {
            copyValues.sort((a,b) => {
                return b.value.localeCompare(a.value);
            })
        }
        return copyValues;
    }
    const initialSelectedIndex = () => {
        if (props.defaultIndex) {
            return props.defaultIndex;
        } else {
            return 0;
        }
    }

    const [show, setShow] = useState(false);
    const [sortedValues, setSortedValues] = useState(initialSortValues);
    const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);

    useEffect(() => {
        document.addEventListener('click', checkIfUnfocused, false);
    })

    const updateShow = (curVal: boolean) => {
        return !curVal;
    }

    function handleClick(event) {
        setShow(updateShow);
        const selected_box = document.getElementById(`selected-box-${props.baseKey}`);
        if (selected_box){
            selected_box.style.width = `${Math.ceil(selected_box?.offsetWidth)}px`;
            for (let i = 0; i < sortedValues.length; i++) {
                const option = document.getElementById(`dropdown-option-${i}-${props.baseKey}`);
                if (option) {
                    option.style.width = selected_box.style.width;
                }
            }
        }
    }

    function dropdownOnClick(index: number, event: Event) {
        setSelectedIndex(index);
        setShow(updateShow);
        event.preventDefault();
    }


    function checkIfUnfocused(e){
        if (show && e.target.id !== `selected-box-${props.baseKey}` && !e.target.id.includes("dropdown-option")){
            setShow(updateShow);
        }
    }

    return(
        <div className={`${styles.container} ${props.className}`} key={props.baseKey}>
            <div className={styles.selectedBox} onClick={handleClick} id={`selected-box-${props.baseKey}`}>
                {sortedValues.find(x => x.index === selectedIndex)?.value}
            </div>
            <div className={show ? styles.dropdown : styles.hiddenDropdown} id={`dropdown-menu-${props.baseKey}`}>
                {sortedValues.map((value, index) => {
                    if (value.index !== selectedIndex) {
                        return (
                            <div className={styles.dropdownOption} key={`dropdown-option-${index}-${props.baseKey}`}
                                onClick={(e) => dropdownOnClick(value.index, e)} id={`dropdown-option-${index}-${props.baseKey}`}>
                                    {value.value}
                            </div>
                        )
                    }
                })}
            </div>
        </div>
    )
}