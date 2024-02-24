import {updatePubsWithSemanticScholar} from '../semantic-scholar/wrappers';
import {updatePubsWithIciteRCR} from '../icite/paper';

export const updatePubsWithExternalData = async (
    filteredData, 
    setFilteredData, 
    setSemanticAuthorIds, 
    setSemanticAuthorInfo,
    setFinalFlags,
    setIciteRCRDataLoaded
) => {

    const iciteUpdate = await updatePubsWithIciteRCR(filteredData, setFilteredData, setIciteRCRDataLoaded);

    const semanticUpdate = await updatePubsWithSemanticScholar(
        iciteUpdate.updatedData, 
        setFilteredData, 
        setSemanticAuthorIds, 
        setSemanticAuthorInfo,
        setFinalFlags);

    return semanticUpdate.updatedData;
    
}