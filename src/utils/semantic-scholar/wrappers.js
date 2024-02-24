import { extractDOIorPMID } from "../common/regex-based";
import {getPaperCitationCountsByDOI, getPaperCitationCountsByDOICustom} from "./paper"
import {getAuthorInfo} from "./author"


export const updatePubsWithSemanticScholar = async (
    pubs, 
    updateMainData, 
    setSemanticAuthorIds, 
    setSemanticAuthorInfo,
    setFinalFlags) => {
    const semanticUpdate = await getCitationsByDOI(pubs, updateMainData, setSemanticAuthorIds);
    setFinalFlags({updatedData: semanticUpdate.updatedData, 
        pubCitations: {success: semanticUpdate.success, partial: semanticUpdate.partial}
    });    

    const semanticAuthorUpdate = await getSemanticAuthorInfo(
        Array.from(semanticUpdate.authorIds),
        setSemanticAuthorInfo,
        semanticUpdate.updatedData,
        updateMainData
    )
    setFinalFlags({updatedData: semanticAuthorUpdate.updatedData,
        pubCitations: {success: semanticUpdate.success, partial: semanticUpdate.partial}, 
        authorInfo: {success: semanticAuthorUpdate.success}
    });
    return semanticUpdate;
    // console.log(Object.keys(citationsByDOI).length);
}

export const getSemanticAuthorInfo = async (authorIds, updateSemanticAuthorInfo, data, updateMainData) => {
    const batchsize = 500;
    let startidx = 0;
    let authorInfo = {};
    // console.log('before fetching author info')
    let semanticCallCount = 0;
    while(startidx < authorIds.length) {
        console.log(' fetching author info ', startidx, ' of ', authorIds.length)
        const authorIdsInBatch = authorIds.slice(startidx, startidx + batchsize);
        try{
            const authorInfoBatch = await getAuthorInfo(authorIdsInBatch);
            semanticCallCount += 1;
            authorInfo = {
                ...authorInfo,
                ...authorInfoBatch
            }
            startidx += batchsize;
        }  catch(err) {
            console.error(`Error making a request ${err}`)
            if (err.response?.status === 400) {
                console.error('Try with pmid');
            } else {
                console.log(`Request failed ${err.request?.path} - ${err.response?.status}`);
            }
            return {updatedData: null, success: false};
            // throw err;
        }
    }
    console.log(`Total Semantic Scholar Author API calls : ${semanticCallCount}`)
    updateSemanticAuthorInfo(authorInfo);
    console.log('beginning author update on pubs')
    const updatedData = data.map((entry) => {
        const {authors} = entry
        for(const semanticAuthorId in authors) {
            if(authorInfo[semanticAuthorId]) {
                let semanticAuthor = authors[semanticAuthorId];
                semanticAuthor = {
                    ...semanticAuthor,
                    ...authorInfo[semanticAuthorId]
                }
                authors[semanticAuthorId] = semanticAuthor;
            }
        }
        let author_first_paper_count,  author_first_citation_count, author_first_hindex;
        let author_last_paper_count,  author_last_citation_count, author_last_hindex;
        if(entry.author_first_semantic_id) {
            author_first_paper_count = authors[entry.author_first_semantic_id]?.paperCount
            author_first_citation_count = authors[entry.author_first_semantic_id]?.citationCount
            author_first_hindex = authors[entry.author_first_semantic_id]?.hIndex
        }
        if(entry.author_last_semantic_id) {
            author_last_paper_count = authors[entry.author_last_semantic_id]?.paperCount
            author_last_citation_count = authors[entry.author_last_semantic_id]?.citationCount
            author_last_hindex = authors[entry.author_last_semantic_id]?.hIndex

        }
        return {...entry, authors, author_first_paper_count,  author_first_citation_count, author_first_hindex,
            author_last_paper_count,  author_last_citation_count, author_last_hindex}
    })
    console.log('done author update on pubs')
    updateMainData(updatedData);
    return {updatedData, success: true}
}

export const getCitationsByDOI = async (pubs, updateMainData, updateSemanticAuthorIds) => {
    const batchsize = 100;
    let startidx = 0;
    let pubsUnderUpdate = [...pubs];
    const semanticAuthorIds = new Set();
    const failedDOIs = []
    let semanticCallCount = 0;
    let failedSemanticCallCount = 0;

    while(startidx < pubs.length) {
        const pubsInBatch = pubs.slice(startidx, startidx + batchsize);
        const dois = pubsInBatch.map((pub) => extractDOIorPMID(pub.id_doi));
        const semanticResponse = await getPaperCitationCountsByDOICustom(dois);
        semanticCallCount += 1
        if(semanticResponse){
            const {citationCounts, authorIdDetails} = semanticResponse
            const pubsInBatchWithCitationCounts = pubsInBatch.map((entry) => {
                const doi = extractDOIorPMID(entry.id_doi);
                const pubAuthors = authorIdDetails[doi];
                const authors = {}
                let sem_authors = []
                let author_first_semantic_id, author_last_semantic_id;
                if(pubAuthors && pubAuthors.length > 0) {
                    sem_authors = [...pubAuthors]
                    const firstAuthorSem = pubAuthors[0];
                    const firstAuthLastName = entry.author_first_display_name.split(' ').slice(-1)[0];
                    const firstAuthor = {name: entry.author_first_display_name}
                    if(firstAuthorSem?.name?.includes(firstAuthLastName)){
                        author_first_semantic_id = firstAuthorSem.authorId;
                        firstAuthor['semantic_id'] = firstAuthorSem.authorId;
                        semanticAuthorIds.add(firstAuthorSem.authorId)
                    }
                    const lastAuthorSem = pubAuthors.slice(-1)[0];
                    const lastAuthLastName = entry.author_last_display_name.split(' ').slice(-1)[0];
                    const lastAuthor = {name: entry.author_last_display_name}
                    if(lastAuthorSem?.name?.includes(lastAuthLastName)){
                        author_last_semantic_id = lastAuthorSem.authorId;
                        lastAuthor['semantic_id'] = lastAuthorSem.authorId;
                        semanticAuthorIds.add(lastAuthorSem.authorId)
    
                    }
                    authors[firstAuthorSem.authorId] = firstAuthor;
                    authors[lastAuthorSem.authorId] = lastAuthor;
                }
                return {
                    ...entry,
                    author_first_semantic_id,
                    author_last_semantic_id,
                    authors,
                    sem_authors,
                    publication_citation_count: citationCounts[doi]
                }
                });
            const allPubs = [
                ...pubsUnderUpdate.slice(0, startidx),
                ...pubsInBatchWithCitationCounts,
                ...pubsUnderUpdate.slice(startidx + batchsize)
            ]
            // console.log(allPubs.find((pub) => pub.authors && Object.keys(pub.authors).length > 0))
            updateMainData(allPubs);
            updateSemanticAuthorIds(semanticAuthorIds);
            pubsUnderUpdate = [...allPubs];        
        } else {
            failedSemanticCallCount += 1
            failedDOIs.push(dois); //TODO: retry only these;
        }
        startidx += batchsize;
    } 
    console.log(`Failed Semantic Scholar Publication API calls : ${failedSemanticCallCount}/${semanticCallCount}`)
    const success = failedSemanticCallCount === semanticCallCount ? false: true
    return {updatedData: pubsUnderUpdate, success, authorIds: semanticAuthorIds, partial: failedSemanticCallCount > 0}
}