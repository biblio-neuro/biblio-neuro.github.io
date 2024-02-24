import axios from 'axios';
import { PAPER_URL_ROUTE, SEMANTIC_API_HEADERS } from "./common";

export const getPaperCitationCountsByDOI = async (dois) => {
    const doisFormatted = dois.map((doi) => 'DOI:'+doi);
    const url = PAPER_URL_ROUTE + 'batch?fields=citationCount,title,authors'

    const data = { ids: doisFormatted };
    try{
        const response = await axios.post(url, data, {headers: SEMANTIC_API_HEADERS});
        if(response.status === 200){
            let citationCounts = {}
            let authorIdDetails = {}
            response.data.forEach((entry, i) => {
                if(entry) {
                    citationCounts[dois[i]] = entry.citationCount
                    authorIdDetails[dois[i]] = entry.authors
                }
            })
            return {citationCounts, authorIdDetails};
        } 
    } catch (error) {
        if (error.response) {
          if (error.response.status === 429) {
            // Handle 429 error (Too Many Requests)
            console.log('Too Many Requests:', error.response.data);
          } else {
            // Handle other response errors
            console.log('Error:', error.response.data);
          }
        } else {
          // Handle network or request-related errors
          console.log('Request Error:', error);
        }
      }

}

export const getPaperCitationCountsByDOICustom = async (dois) => {
  const url = 'https://amusing-gregarious-system.glitch.me/semantic-pubs'

  const data = { ids: dois };
  try{
      const response = await axios.post(url, data);
      if(response.status === 200){
          return response.data;
      } 
  } catch (error) {
        console.log('Request Error:', error);
    }

}

// getPaperCitationCountsByDOI(['10.46439/signaling.1.002']);