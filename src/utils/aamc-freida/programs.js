import axios from 'axios';

export const updateProgramInfo = async (setProgramInfo, setAamcProgramInfoDataLoaded) => {
    const url = `https://amusing-gregarious-system.glitch.me/programs`;

    const res = await axios.get(url).catch(error => {
    console.error(error);
  });
  const programInfo = res.data;
  setProgramInfo(programInfo);
  setAamcProgramInfoDataLoaded(true);
}