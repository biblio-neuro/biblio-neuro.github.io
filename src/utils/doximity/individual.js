import axios from 'axios';

export const updateDoximityUserInfo = async (setDoximityUserData, setDoximityUserDataLoaded) => {
    const url = `https://amusing-gregarious-system.glitch.me/individuals`;

    const res = await axios.get(url).catch(error => {
        console.error(error);
    });
    const doximityUserInfo = res.data;
    if(doximityUserInfo) {
        console.log('>>> DOXIMITY LOADED')
        setDoximityUserData(doximityUserInfo);
        setDoximityUserDataLoaded(true);
    } else {
        setDoximityUserDataLoaded(false);
    }
}

export const getDoximityMatchedIndividual = (doximityUserData, name) => {
    if(!name || !doximityUserData) {
      return;
    }
    const nameParts = name.trim().split(' ');
    // General assumption is the last word is last name
    const lastName = nameParts.slice(-1)[0];
    const possibleIndividuals = doximityUserData.filter((user) => user?.name.includes(lastName))
    
    const matchIndividual = (user, nameToMatch) => {
      const matchFound = nameToMatch.reduce((partialMatch, namePart) => {
        return partialMatch && user?.name.includes(namePart.trim().replace(/\.$/g, ''));
      }, true);
      return matchFound;
    }

    const matchedIndividuals = possibleIndividuals.filter((user) => matchIndividual(user, nameParts))
    
    return matchedIndividuals; 
  }
