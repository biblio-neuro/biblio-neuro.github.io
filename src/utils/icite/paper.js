import axios from 'axios';
import {extractDOIorPMID} from '../common/regex-based';
export const BASE_URL = 'https://icite.od.nih.gov/api';


export const PAPER_URL_ROUTE = 'pubs';

export const getRCRStatsByPMIDBatch = async (pmids) => {
    const url = [BASE_URL, PAPER_URL_ROUTE].join('/')+'?pmids='+pmids.join(',')
    const rcrStatsByPMID = {}
    const response = await axios.get(url);
    if(response.status === 200){
        response.data?.data.forEach((pmidEntry) => {
            if(pmidEntry) {
                rcrStatsByPMID[pmidEntry.pmid] = pmidEntry;
            } 
        });
        return rcrStatsByPMID;
    } else if(response.status === 429) {
        throw new Error('Too many requests');
    }
}

export const getRCRStatsByPMID = async (pubs, updateMainData) => {
    const batchsize = 500;
    let startidx = 0;
    let pubsUnderUpdate = [...pubs];
    while(startidx < pubs.length) {
        const pubsInBatch = pubs.slice(startidx, startidx + batchsize);
        const pmids = pubsInBatch.map((pub) => pub.id_pmid ? extractDOIorPMID(pub.id_pmid) : null).filter((entry) => entry);
        const rcrStatsByPMID = await getRCRStatsByPMIDBatch(pmids);
        const pubsInBatchWithCitationCounts = pubsInBatch.map((entry) => (
            {
            ...entry,
            rcrStats: rcrStatsByPMID[extractDOIorPMID(entry.id_pmid)] 
            }
        ));
        const allPubs = [
            ...pubsUnderUpdate.slice(0, startidx),
            ...pubsInBatchWithCitationCounts,
            ...pubsUnderUpdate.slice(startidx + batchsize)
        ]
        // console.log(allPubs.find((pub) => pub.authors && Object.keys(pub.authors).length > 0))
        updateMainData(allPubs);
        pubsUnderUpdate = [...allPubs];
        startidx += batchsize;
    } 
    return {updatedData: pubsUnderUpdate, success:  true}
}

export const updatePubsWithIciteRCR = async (
    pubs, 
    updateMainData, 
    setIciteLoadStatus) => {
    const iciteUpdate = await getRCRStatsByPMID(pubs, updateMainData);
    console.log(`>>> ICITE RCR LOADED`);
    // console.log(iciteUpdate?.updatedData[0])
    setIciteLoadStatus(iciteUpdate.success);  
    return iciteUpdate;
}