import axios from 'axios';
import { PROGRAMS_DATA_ENDPOINT } from '../config/api-endpoints';

export const updateProgramInfo = async (setProgramInfo, setAamcProgramInfoDataLoaded) => {
    const res = await axios.get(PROGRAMS_DATA_ENDPOINT).catch(error => {
    console.error(error);
  });
  const programInfo = res.data;
  setProgramInfo(programInfo);
  setAamcProgramInfoDataLoaded(true);
}