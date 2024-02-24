import axios from 'axios';
import { AUTHOR_URL_ROUTE } from "./common";

export const getAuthorInfo = async (authorIds) => {
    const url = AUTHOR_URL_ROUTE + 'batch?fields=name,citationCount,hIndex,paperCount'

    const data = { ids: authorIds };
    const response = await axios.post(url, data);
    if(response.status === 200){
        let authorDetails = {}
        response.data.forEach((entry, i) => {
            if(entry) {
                authorDetails[authorIds[i]] = entry 
            }
        })
        return authorDetails;
    } else if(response.status === 429) {
        throw new Error('Too many requests');
    }
}