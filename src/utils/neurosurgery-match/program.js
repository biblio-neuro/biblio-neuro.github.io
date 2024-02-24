import axios from "axios"
import DATA from '../../assets/nsgymatch_bd_20230512_183017.csv';


export const getProgramInfo = async () => {
    const res = await fetch(DATA)
    const txt = res.text()
    return txt;
}