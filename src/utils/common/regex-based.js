export const extractDOIorPMID = (url) => {
  /*
    https://doi.org/10.1016/j.jocn.2022.11.013
    OR
    https://pubmed.ncbi.nlm.nih.gov/31593256
  */

    if(url) {
      const regex = /^(\w+:\/\/)([^\/]+\/?)([^\/].*)$/;
      const match = url.match(regex);
  
      if (match) {
        const protocol = match[1]; // https
        const domain = match[2]; // doi.org/
        const path = match[3]; // 10.1016/j.jocn.2022.11.013 or 31593256
        return path;
      } 
    }
    // console.error(`DOI/PMID URL does not match pattern: ${url}`);
    return null;
}