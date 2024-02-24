import React from 'react';
import {Button, Box, CircularProgress} from '@mui/material';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';

const ExternalDataStatus = (props) => {

    const {doximityUserDataLoaded,
        iciteRCRDataLoaded,
        aamcProgramInfoDataLoaded,
        semanticPubCitationDataLoaded,
        semanticPubCitationPartialLoaded,
        semanticAuthorInfoDataLoaded,
        timedout,
        fetchingExternalData
    } = props.status

    return (
        <Box
        sx={{ display: 'flex', gap: '1rem', p: '0.5rem', flexWrap: 'wrap', flexDirection: 'row-reverse' }}
      >
      <Button
      disabled={!doximityUserDataLoaded}
          sx={{alignItems: 'left'}}
          color="success"
          //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
          startIcon={
            doximityUserDataLoaded ? 
            <DoneOutlineIcon />
            : fetchingExternalData && <CircularProgress />
          }
          variant="contained"
        >
          Doximity User Info
      </Button>
      <Button
      disabled={!iciteRCRDataLoaded}
          sx={{alignItems: 'left'}}
          color="success"
          //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
          startIcon={
            iciteRCRDataLoaded ? 
            <DoneOutlineIcon />
            : fetchingExternalData && <CircularProgress />
          }
          variant="contained"
        >
          iCite NIH Publication Metrics
      </Button>
      <Button
      disabled={!aamcProgramInfoDataLoaded}
          sx={{alignItems: 'left'}}
          color="success"
          //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
          startIcon={
            aamcProgramInfoDataLoaded ? 
            <DoneOutlineIcon />
            : fetchingExternalData && <CircularProgress />
          }
          variant="contained"
        >
          AAMC FREIDA Program INFO
      </Button>
      <div>        
      <Button
      disabled={!semanticPubCitationDataLoaded}
          sx={{alignItems: 'left'}}
          color={timedout ? "error" : semanticPubCitationPartialLoaded ? "warning" : "success"}
          //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
          startIcon={
            semanticPubCitationDataLoaded ? 
            <DoneOutlineIcon />
            : timedout ? <SyncProblemIcon/>
            : fetchingExternalData && <CircularProgress />
          }
          variant="contained"
        >
          SemanticScholar Publication Data
      </Button>
      </div> 
      {semanticPubCitationDataLoaded ? <Button
      disabled={!semanticAuthorInfoDataLoaded}
          sx={{alignItems: 'left'}}
          color="success"
          //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
          startIcon={
            semanticAuthorInfoDataLoaded ? 
            <DoneOutlineIcon />
            : fetchingExternalData && <CircularProgress />
          }
          variant="contained"
        >
          SemanticScholar Author Data
      </Button> :
      ''
     }
      </Box> 
    )
}

export default ExternalDataStatus;