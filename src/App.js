import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as dfd from "danfojs"
import EnhancedTable from './PaginatedTable';
import EnhancedTableToolbar from './EnhancedTableToolbar';
import SearchFromSelect from './SearchFromSelect';
import {Typography, Button, Box, LinearProgress,
TableHead, TableRow, TableCell, TableBody, CircularProgress, Table} from '@mui/material';
import {updatePubsWithExternalData} from './utils/common/wrappers';
import {updateProgramInfo} from './utils/aamc-freida/programs';
import {updateDoximityUserInfo} from './utils/doximity/individual'
import {FileDownload as FileDownloadIcon} from '@mui/icons-material';
import { ExportToCsv } from 'export-to-csv'; 
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import ToggleButton from '@mui/material/ToggleButton';
import extractRowExport, {exportRowExport} from './utils/data-export/export';
import { getProgramInfo as getNSGYProgramInfo } from './utils/neurosurgery-match/program';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import ExternalDataStatus from './components/ExternalDataStatus'

const constructDataFrame = async (pandasDF) => {
  /**
   * {id: {0: 'A', 1: 'B'},
   * name: {0: 'X', 1: 'Y'}}
   * 
   * NEEDED:
   * {
   * id: ['A', 'B'],
   * name: ['X', Y']}
   */
  const dataFrameObj = {};
  Object.keys(pandasDF).forEach((column) => {
    dataFrameObj[column] = []
    Object.keys(pandasDF[column]).forEach((idx) => {
      dataFrameObj[column].push(pandasDF[column][idx]);
    })
  });
  const dataFrame = await new dfd.DataFrame(dataFrameObj);
  return dataFrame;
}

const FIELDS_OF_INTEREST = [
"author_last_display_name", "author_last_education_name", 
"author_last_ama_program_name", "author_last_program_id", "author_last_position_rank", 
"author_first_display_name", "first_author_student", "author_first_edu_level",
"id_doi", "id_pmid", "title", "publication_date",
"author_last_affiliation_match",         "author_last_THA_city",
"author_last_THA_state",
"author_last_program_setting",
"author_last_num_residents_on_duty",
"author_last_director_phd"
]

const columnMetadata = [  
  {
    id: 'title',
    numeric: false,
    disablePadding: false,
    label: 'Title',
  },
  {
  id: 'publication_date',
  numeric: false,
  disablePadding: false,
  label: 'Publication Date',
  transform: (value) => {
    if(value && typeof value === 'number' && !Number.isNaN(value)) {
      return new Date(value).toISOString().split('T')[0]
    }
    return value;
  }
},
{
  id: 'id_doi',
  numeric: false,
  disablePadding: false,
  label: 'DOI',
  collapsible: true
},
{
  id: 'publication_citation_count',
  numeric: true,
  disablePadding: false,
  label: 'Citation Count',
},
  {
    id: 'author_first_display_name',
    numeric: false,
    disablePadding: false,
    label: 'First Author',
    collapsible: true
  },
  {
    id: 'author_first_edu_level',
    numeric: false,
    disablePadding: false,
    label: 'First Author Edu Level',
    transform: (value) => {
      const mapping = {
        'student?' : 'Student', 
        'faculty' : 'Faculty', 
        'resident' : 'Resident', 
        'MD' : 'MD', 
        'fellow' : 'Fellow'
      }
      if(value && value !== '') {
        return mapping[value.toLowerCase()] || value;
      }
      return value;
    }
    },  
  // {
  //   id: 'first_author_student',
  //   numeric: false,
  //   disablePadding: false,
  //   label: 'Is First Author Student?',
  // },  
  {
    id: 'author_last_display_name',
    numeric: false,
    disablePadding: false,
    label: 'Last Author',
    collapsible: true
  }, {
    id: 'author_last_position_rank',
    numeric: false,
    disablePadding: false,
    label: 'Last Author Rank',
  },
  {
      id: 'author_last_education_name',
      numeric: false,
      disablePadding: true,
      label: 'Last Author Program',
      collapsible: true
    }
];

function Disclaimer (props) {
  const { type, text } = props;
  const color = type === 'info' ? '#007bff' : '#ffc107'; // Blue for info, Yellow for disclaimer
  const backgroundColor = type === 'info' ? '#e6f7ff' : '#fff3cd'; // Light blue for info, Light yellow for disclaimer

  const disclaimerStyle = {
    color,
    backgroundColor,
    padding: '10px',
    marginTop: '20px',
    borderRadius: '5px'
  };

  return <div style={disclaimerStyle}>{text}</div>;
}

export const getProgramDisplay = (row) => {
  return (
    <Table size="small" aria-label="programs">
    <TableHead>
      <TableRow>
      <TableCell component="th" scope="row">
            ACGME ID
          </TableCell>
        <TableCell>No. of Physician Faculty</TableCell>
        <TableCell>No. of Non-Physician Faculty</TableCell>
        <TableCell> Female full-time Clinical Faculty (%)</TableCell>
        <TableCell >Avg. Work hrs/week</TableCell>
        <TableCell >Moonlighting Allowed</TableCell>
        <TableCell >Night Float</TableCell>
        <TableCell >Govt. Affiliated</TableCell>
        <TableCell >Applications Interviews-PGY1 ratio</TableCell>
      </TableRow>
    </TableHead>
    {
    row ?
    <TableBody>
      <TableRow>
    <TableCell component="th" scope="row">
            {row.program_id.split(':')[1].trim()}
          </TableCell>
        <TableCell>{row.fac_ft_paid_physician}</TableCell>
        <TableCell>{row.fac_ft_paid_non_physician}</TableCell>
        <TableCell>{row.fac_percent_ft_female}</TableCell>
        <TableCell>{row.work_avg_hrs_week}</TableCell>
        <TableCell>{row.work_moonlight}</TableCell>
        <TableCell>{row.work_nightfloat}</TableCell>
        <TableCell>{row.gov_affiliation}</TableCell>
        <TableCell>{row.appinfo_ratio_interviews_pgy1positions}</TableCell>
        </TableRow>
    </TableBody> :
    <CircularProgress size={20} style={{ marginRight: '0.5em' }} />
  }
  </Table>
  )
}

const PUBLICATION_STATIC_DATA_URL = 'https://raw.githubusercontent.com/cervere/bibliometric-tool-static/main/data/pubs_with_author_match_latest_10042023.json';

const PUBLICATION_DATA_API = 'https://big-agate-lumber.glitch.me/pub-ind-pro'

function App() {
    // initialize state for the data
    const [downloadErrors, setDownloadErrors] = useState();
    const [publicationsSince, setPublicationsSince] = useState(2013);
    const [data, setData] = useState();
    const [rawData, setRawData] = useState();
    const [rawDataLoaded, setRawDataLoaded] = useState(false);
    const [fullDataLoaded, setFullDataLoaded] = useState(false);
    const [semanticAuthorIds, setSemanticAuthorIds] = useState();
    const [semanticAuthorInfo, setSemanticAuthorInfo] = useState();
    const [semanticPubCitationDataLoaded, setSemanticPubCitationDataLoaded] = useState(false);
    const [semanticPubCitationPartialLoaded, setSemanticPubCitationPartialLoaded] = useState(false);
    const [semanticAuthorInfoDataLoaded, setSemanticAuthorInfoDataLoaded] = useState(false);
    const [aamcProgramInfoDataLoaded, setAamcProgramInfoDataLoaded] = useState(false);
    const [semanticDataLoaded, setSemanticDataLoaded] = useState(false);
    const [iciteRCRDataLoaded, setIciteRCRDataLoaded] = useState(false);
    const [startYear, setStartYear] = useState(2013);
    const [programSearch, setProgramSearch] = useState();
    const [filteredData, setFilteredData] = useState();
    const [uniquePrograms, setUniquePrograms] = useState();
    const [programInfo, setProgramInfo] = useState();
    const [doximityUserData, setDoximityUserData] = useState();
    const [doximityUserDataLoaded, setDoximityUserDataLoaded] = useState();
    const [matchAffiliation, setMatchAffiliation] = useState(false);
    const [timedout, setTimedout] = useState(false); 
    const [fetchingExternalData, setFetchingExternalData] = useState(false);
    const semanticDataLoadedRef = useRef(semanticDataLoaded); // Using useRef to create a stable reference

    const filterRecords = (records, year, program) => {
      const filteredRecords = records?.filter((record) => {
        return new Date(record.publication_date).getFullYear() >= year
      })
      if(program && program.name?.trim() !== '') {
        return filteredRecords.filter((record) => (
          record.author_last_education_name?.includes(program.name)
        ))
      }
      return filteredRecords
    }

    const setFinalFlags = (semanticUpdate) => {
      console.log('>>> Just loaded semantic');
      // console.log(semanticUpdate?.updatedData[0]);
      setSemanticPubCitationDataLoaded(semanticUpdate.pubCitations?.success)
      setSemanticPubCitationPartialLoaded(semanticUpdate.pubCitations?.partial)
      setSemanticAuthorInfoDataLoaded(semanticUpdate.authorInfo?.success)
      setSemanticDataLoaded(semanticUpdate.pubCitations?.success && semanticUpdate.authorInfo?.success);
    }
  
    const getProgramInfo = (programId) => {
      if(programInfo) {
        return getProgramDisplay(programInfo[programId]);
      } else {

      }
    }
    // load data from JSON file
    useEffect(() => {
      const dataLoadTimeout = 90000; // 30 seconds
      const timer = setTimeout(() => {
        // Here, access xRef.current instead of x directly
        if (semanticDataLoadedRef.current) {
          // Your code to execute after 90 seconds if x is true
          console.log('Semantic Scholar data is loaded');
        } else {
          setTimedout(true)
        }
      }, dataLoadTimeout); // 90 seconds
  
        fetch(PUBLICATION_DATA_API)
        .then(response => response.json())
        .then(res_data => {
          // const dataFrame = new dfd.DataFrame(data);
          // console.log(dataFrame.columns);
          // constructDataFrame(res_data).then(async (dataFrame) => {
          //   const minifiedDF = await dataFrame.loc({columns: FIELDS_OF_INTEREST})
          //   setRawData(await dfd.toJSON(dataFrame));
          //   setRawDataLoaded(true);
          //   const loadedData = await dfd.toJSON(minifiedDF);
          //   setDFs(loadedData).then(() => {
          //     setFullDataLoaded(true);
          //   });
          // });

          /**
           * {
              "someData": true,
              "count": 998,
              "updateAt": "2023-12-16T15:17:47.801Z",
              "data": { ... }
           }
           */
          const loadedData = Object.values(res_data.data);
          setDownloadErrors(res_data.message);
          if(res_data.publicationsSince) {
            setPublicationsSince(res_data.publicationsSince);
          }
          setRawData(loadedData);
          setRawDataLoaded(true);
          setDFs(loadedData).then(() => {
            setFullDataLoaded(true);
          });
        })
        .catch(error => console.error(error));
    }, [])


  useEffect(() => {
    // Whenever x changes, update the value in xRef as well
    semanticDataLoadedRef.current = semanticDataLoadedRef;
  }, [semanticDataLoadedRef]);

  const setDFs = async (loadedData) => {
    // const programNSGY = await getNSGYProgramInfo();
    // console.log(programNSGY)
    setData(loadedData);
    // console.log('>>>>', loadedData.find((entry) => entry.authors && Object.keys(entry.authors).length > 0));
    // console.log(data.map((entry) => citations[extractDOI(entry.id_doi)]))

    let filteredData;
    if(matchAffiliation){
      filteredData = loadedData.filter((row) => row.author_last_affiliation_match);
    } else {
      filteredData = [...loadedData];
    }
    const programs = filteredData.map(
      (entry) => {
        return {id: entry.author_last_program_id, name: entry.author_last_education_name}
      });
    const programNames = programs.map(({name}) => name)
    const uniquePrograms = programs.filter(((entry, index) => programNames.indexOf(entry.name) === index));
    setUniquePrograms(uniquePrograms);
    setFilteredData(filteredData);
    return true;
  }


  const updateFromExternalAPis = async () => {
    setFetchingExternalData(true);
    await updatePubsWithExternalData(
      filteredData, 
      setFilteredData, 
      setSemanticAuthorIds, 
      setSemanticAuthorInfo,
      setFinalFlags,
      setIciteRCRDataLoaded
    );
    await updateProgramInfo(setProgramInfo, setAamcProgramInfoDataLoaded);
    await updateDoximityUserInfo(setDoximityUserData, setDoximityUserDataLoaded);
    setFetchingExternalData(false);
  }
  // if(rawDataLoaded) {
  //   if(semanticDataLoaded) {
      
  //   } else {
  //   console.log('Semantic citations are being loaded...');
  //   }
  //   // setFilteredData(filterRecords(filteredData, startYear, programSearch));
  // } 

  const handleYearChange = (event) => {
    setStartYear(event.target.value);
  };

  const handleExportData = (data, filtered=true) => {
    const csvOptions = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      useBom: true,
      useKeysAsHeaders: true,
      title: 'Publications_Authors',
      // headers: columnMetadata.map((c) => c.header),
    };
    let title = csvOptions.title;
    if(filtered) {
      if(programSearch?.name) {
        title = title + `_${programSearch.name}`
      } else {
        title = title + '_AllPrograms'
      }
      title = title + `_Since${startYear}`
    } else {
      title = title + '_AllPrograms_Since2013'
    }
    csvOptions.title = title; 
    csvOptions.filename = title;
    const csvExporter = new ExportToCsv(csvOptions);
    csvExporter.generateCsv(data);
  };


  const loadingFields = useMemo(() => {
    if(!fetchingExternalData) {
      return [];
    }
    const fields = semanticDataLoaded ? []
          : semanticPubCitationDataLoaded ? ['author_first_display_name', 'author_last_display_name'] 
          : ['author_first_display_name', 'author_last_display_name', 'publication_citation_count'];
    if(!aamcProgramInfoDataLoaded) {
      fields.push('author_last_education_name');
    } 
    if(!iciteRCRDataLoaded) {
      fields.push('id_doi');
    }
    if(!doximityUserDataLoaded) {
      fields.push('doximity')
    }
    return fields;
  }, 
  [aamcProgramInfoDataLoaded, semanticDataLoaded, semanticPubCitationDataLoaded, iciteRCRDataLoaded,
    doximityUserDataLoaded, fetchingExternalData])

  const allUpdatedData = useMemo(() => {
    let data ;
    if(matchAffiliation) {
      data = filteredData?.filter((row) => row.author_last_affiliation_match)
    } else {
      data = filteredData && [...filteredData]
    }
    return filterRecords(data, startYear, programSearch)
  }, 
  [filteredData, startYear, programSearch, matchAffiliation]);

  const dataToExport = useMemo(() => {
    if((semanticDataLoaded || timedout) &&
      aamcProgramInfoDataLoaded &&
      iciteRCRDataLoaded && 
      doximityUserDataLoaded) {
      return filteredData.map((entry) => extractRowExport(entry, programInfo, doximityUserData))
    }

  }, [
    filteredData, 
    semanticDataLoaded, 
    aamcProgramInfoDataLoaded, 
    iciteRCRDataLoaded, 
    doximityUserDataLoaded, 
    programInfo,
    doximityUserData, timedout])

  const filteredDataToExport = useMemo(() => {
    if(dataToExport) {
      return allUpdatedData.map((entry) => extractRowExport(entry, programInfo, doximityUserData))
    }
  }, [allUpdatedData, dataToExport, programInfo, doximityUserData])

  return (
    <div className="App">
      <h1> Publications by program </h1>
      {allUpdatedData ?       
      (      
      <div className="content">      
        <EnhancedTableToolbar startYear={publicationsSince} year={startYear} handleYearChange={handleYearChange} />
        <SearchFromSelect sx={{alignItems: 'center'}} options={uniquePrograms} onSelect={setProgramSearch}/>
      <ToggleButton
      value="check"
      selected={matchAffiliation}
      onChange={() => {
        setMatchAffiliation(!matchAffiliation);
      }}
    >
      {matchAffiliation ? <DoneOutlineIcon /> : ''}
      <Typography>
      Last Author Affiliations
      </Typography>
    </ToggleButton>
    <p><Button
        disabled={fetchingExternalData || allUpdatedData.length === 0 || downloadErrors.length > 0}
            sx={{alignItems: 'left'}}
            color="success"
            variant="contained"
            onClick={() => updateFromExternalAPis()}
          >
          {fetchingExternalData ? 'Fetching External Data...' : 'Fetch External Data'}  
    </Button> </p>
    {
      downloadErrors && downloadErrors.map((error, i) =>         
      <Disclaimer key={i} type="disclaimer" text={error} />
      )
    }
      <Box
          sx={{ display: 'flex', gap: '1rem', p: '0.5rem', flexWrap: 'wrap', flexDirection: 'row-reverse' }}
        >
        <Button
        disabled={!dataToExport}
            sx={{alignItems: 'left'}}
            color="primary"
            //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
            onClick={() => handleExportData(filteredDataToExport, true)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Export Filtered Data
        </Button>
        <Button
        disabled={!dataToExport}
            sx={{alignItems: 'left'}}
            color="primary"
            //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
            onClick={() => handleExportData(dataToExport, false)}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Export All Data
        </Button>
        {
          (timedout ? <Disclaimer type="disclaimer" text="NOTE: Some data from Semantic Scholar API might be missing!!" /> : (semanticDataLoaded && aamcProgramInfoDataLoaded) ? ''  : <LinearProgress  />)
        }
        </Box>
        <EnhancedTable 
        columnMetadata={columnMetadata} 
        rows={allUpdatedData} 
        loadingFields={loadingFields}
        timedout={timedout}
        getProgramInfo={getProgramInfo}
        doximityUserData={doximityUserData}
        fetchingExternalData={fetchingExternalData}
        />
        <Disclaimer type="info" text="Student: Individual with no record as Resident/Faculty/Fellow nor a clinician profile on Doximity is labelled as a Student." />
        <ExternalDataStatus 
        status={{doximityUserDataLoaded,
          iciteRCRDataLoaded,
          aamcProgramInfoDataLoaded,
          semanticPubCitationDataLoaded,
          semanticPubCitationPartialLoaded,
          semanticAuthorInfoDataLoaded,
          fetchingExternalData,
          timedout}}
        />
        {timedout && <Disclaimer type="disclaimer" text="Data fetch failed! We are currently using a free version of Semantic Scholar API, which is rate limited. Please reload the page after some time." />}
        {semanticPubCitationPartialLoaded && <Disclaimer type="disclaimer" text="Some of the publication data might be missing due to the limitations of the free version of Semantic Scholar API. Please reload the page after some time." />}
        <Box
          sx={{ display: 'flex', gap: '1rem', p: '0.5rem', flexWrap: 'wrap', flexDirection: 'row-reverse' }}
        >
        <Button
        disabled={!semanticAuthorInfoDataLoaded}
            sx={{alignItems: 'left'}}
            color="primary"
            variant="contained"
          >
            Update Backend Database
        </Button>
        </Box>
        </div>
      )  :
      <div className="App-header">
        <div className="loader" >
        <img className="App-logo" src={logo} alt="logo" />
        <h1> Loading data...</h1>
       </div>
       </div>
      }
    </div>
  );
}



export default App;
