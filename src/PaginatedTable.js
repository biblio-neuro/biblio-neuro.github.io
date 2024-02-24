import * as React from 'react';
import PropTypes from 'prop-types';
import {Box, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, Paper, CircularProgress,
        Typography, IconButton, Collapse, LinearProgress} from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { extractDOIorPMID } from './utils/common/regex-based';
import { styled } from '@mui/material/styles';
import {getDoximityMatchedIndividual} from './utils/doximity/individual'
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}


function EnhancedTableHead(props) {
  const { onSelectAllClick, columnMetadata, order, orderBy, numSelected, rowCount, onRequestSort, collapsibleFields, 
    loadingFields, timedout, fetchingExternalData } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const infoMessage = 'More information is updated from an external API. Verify the status below and click above to (re)fetch the external data';
  const cellElems = [];

  columnMetadata.forEach((headCell, i) => {
    cellElems.push(
    <TableCell
      key={headCell.id}
      align={headCell.numeric ? 'center' : 'center'}
      padding={headCell.disablePadding ? 'none' : 'none'}
      sortDirection={orderBy === headCell.id ? order : false}
    >
      <TableSortLabel
        active={orderBy === headCell.id}
        direction={orderBy === headCell.id ? order : 'asc'}
        onClick={createSortHandler(headCell.id)}
      >
        {headCell.label}
        {
        loadingFields?.includes(headCell.id) ? 
        ( 
        (['author_first_display_name', 'author_last_display_name', 'publication_citation_count']).includes(headCell.id) && timedout 
        ? <SyncProblemIcon /> 
        : fetchingExternalData ? <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <CircularProgress size={20} style={{ marginRight: '0.5em' }} />
          </span> 
        : <Tooltip title={infoMessage}><InfoIcon /></Tooltip>
        ) : ''
        }
        {orderBy === headCell.id ? (
          <Box component="span" sx={visuallyHidden}>
            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
          </Box>
        ) : null}
      </TableSortLabel>
    </TableCell>)
    if(headCell.collapsible) {
      cellElems.push(<TableCell key={'collapsible-'+headCell.id}/>)
    }})
    
  return (
    <TableHead>
      <TableRow>
      {cellElems.map((elem) => elem)}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

export const getIciteDisplay = (row) => {
  const ICITE_FIELDS_OF_INTEREST = [
    // 'year',
    { label: 'Journal', key: 'journal'},
    // { label: 'Research A', key: 'is_research_article'},
    { label: 'RCR', key: 'relative_citation_ratio', round: true},
    { label: 'NIH %ile', key: 'nih_percentile'},
    { label: 'Clinical Work?', key: 'is_clinical'},
    // 'citation_count', // For now, coming from SemanticScholar
    { label: 'Citations/year', key: 'citations_per_year', round: true},
    { label: 'Field Citation Rate', key: 'field_citation_rate', round: true}
  ]


  return (
    <Table size="small" aria-label="programs">
    <TableHead>
      <TableRow>
      <TableCell component="th" scope="row" key={0}>
            PMID
          </TableCell>
          {
          ICITE_FIELDS_OF_INTEREST.map((field, idx) => <TableCell key={idx+1}>{field.label}</TableCell>)
          }
      </TableRow>
    </TableHead>
    {
    row.id_pmid ?
    <TableBody>
      {
    row.rcrStats ? (<TableRow>
    <TableCell component="th" scope="row">
       {row.id_pmid ? extractDOIorPMID(row.id_pmid) : '-'}
     </TableCell>
     {
     ICITE_FIELDS_OF_INTEREST.map((field, idx) => <TableCell key={idx+1}>
       {field.round ?Math.round((row.rcrStats[field.key] + Number.EPSILON) * 100) / 100
       : row.rcrStats[field.key]}</TableCell>)
     }        
     </TableRow>) :
    <Typography> 
     ICite RCR stats not available!  
    </Typography> 
      }
    </TableBody> :
    <Typography> 
    PMID not found!  
   </Typography> 
  }
  </Table>
  )
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const AuthorTable = (props) => {
  const {name, 
    first, 
    first_author_student, position_rank, 
    hindex, 
    citation_count, 
    paper_count,
    getDoximityInfo,
    loadingFields,
    timedout
  } = props

  const authorDoximityInfo = React.useMemo(() => {
    const info = getDoximityInfo(name);
    return info;
  }, [getDoximityInfo, name])
  

  return (              
  <Table size="small" >
    <TableBody>
    <StyledTableRow>
    <TableCell>
      <Table size="small" aria-label="purchases">
      <TableHead>
        <StyledTableRow>
          {
            first ? 
            <TableCell>Is Author Student</TableCell> :
            <TableCell>Author Rank</TableCell>
            }
          <TableCell>H-Index</TableCell>
          <TableCell align="right">Citation Count</TableCell>
          <TableCell align="right">Paper Count</TableCell>
        </StyledTableRow>
      </TableHead>
      <TableBody>
      {
        timedout ? <StyledTableRow key={name}><SyncProblemIcon/> </StyledTableRow>:
        loadingFields.includes('author_first_display_name') ?
        <StyledTableRow key={name}>
          <LinearProgress /> 
        </StyledTableRow>:
        <StyledTableRow key={name}>
          <TableCell component="th" scope="row">
            {
            first ?
            (first_author_student ? 'Yes' : 'No')
            // </TableCell> 
            :
            // <TableCell component="th" scope="row">
            position_rank
            }
            </TableCell>
            <TableCell>{hindex}</TableCell>
            <TableCell align="right">{citation_count}</TableCell>
            <TableCell align="right">
              {paper_count}
            </TableCell>
            </StyledTableRow>
      }
      </TableBody>
      </Table>
  </TableCell>
  </StyledTableRow>
  {
    loadingFields.includes('doximity') ?  <LinearProgress /> :
    (first_author_student || !authorDoximityInfo || authorDoximityInfo.length === 0)? 
    <StyledTableRow>
      <Typography> 
    Doximity profile not available!  
    </Typography>
    </StyledTableRow>
    : <StyledTableRow>
      <TableCell>
      <Table size="small">
      <TableHead>
      <StyledTableRow>
          <TableCell>Sex : {authorDoximityInfo[0]?.sex}</TableCell> 
          <TableCell>              
                No. of Certifications : {authorDoximityInfo[0]?.certifications}
          </TableCell>
      </StyledTableRow>
        <StyledTableRow>
          <TableCell>Description</TableCell> 
          <TableCell>              
                {authorDoximityInfo[0]?.description}
          </TableCell>
        </StyledTableRow>
      </TableHead>
      <TableBody>
          <StyledTableRow key={name}>
            <TableCell>Summary : </TableCell>
            <TableCell component="th" scope="row">
              {authorDoximityInfo[0]?.summary}
            </TableCell>
          </StyledTableRow>
      </TableBody>
      </Table>
  </TableCell> 
  </StyledTableRow>
    }
              </TableBody>
</Table>
)
}

function Row(props) {
  const { row, idx, programInfo, getDoximityInfo, loadingFields, timedout, columnMetadata } = props;
  const [programOpen, setProgramOpen] = React.useState(false);
  const [firstAuthorOpen, setFirstAuthorOpen] = React.useState(false);
  const [lastAuthorOpen, setLastAuthorOpen] = React.useState(false);
  const [doiOpen, setDoiOpen] = React.useState(false);

  const handleClick = () => {
    setProgramOpen(false);
    setFirstAuthorOpen(false);
    setLastAuthorOpen(false);
    setDoiOpen(false);
  }

  const expandRank = (rank) => {
    let expandedRank = rank.replace(/APD/, 'Asst. Program Director');
    expandedRank = expandedRank.replace(/PD/, 'Program Director');
    expandedRank = expandedRank.replace(/VC/, 'Vice Chair');
    return expandedRank;
  }


  const getTransformedValue = (key, value) => {
    const meta = columnMetadata.find((meta) => meta.id === key);
    if(meta?.transform) {
      const val = meta.transform(value)
      return val.startsWith("Student") ? <a>{val}<sup>*</sup></a> : val
    }
    return value
  }

   return (
    <React.Fragment>
      <TableRow 
          hover
          role="checkbox"
          tabIndex={-1}
          key={6*idx+1}
          sx={{ cursor: 'pointer' , '& > *': { borderBottom: 'unset' }}}
      >
        <TableCell align="center">{row.title}</TableCell>
        <TableCell align="center">
          {
          getTransformedValue('publication_date', row.publication_date)
        }
        </TableCell>
        <TableCell 
          onClick={(event) => handleClick(event)}
          align="right"
          >
            {row.id_doi}
        </TableCell>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setDoiOpen(!doiOpen)}
          >
            {doiOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell align="center">{row.publication_citation_count}</TableCell>
        <TableCell 
        onClick={(event) => handleClick(event)}
        align="center"
        >
          {row.author_first_display_name}
          </TableCell>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setFirstAuthorOpen(!firstAuthorOpen)}
          >
            {firstAuthorOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell align="right">
        {
          getTransformedValue('author_first_edu_level', row.author_first_edu_level)
        }          
        </TableCell>
        <TableCell 
          onClick={(event) => handleClick(event)}
          align="center"
          >
            {row.author_last_display_name}
        </TableCell>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setLastAuthorOpen(!lastAuthorOpen)}
          >
            {lastAuthorOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell align="right">{row.author_last_position_rank && expandRank(row.author_last_position_rank)}</TableCell>
        <TableCell
          onClick={(event) => handleClick(event)}
          component="th"
          scope="row"
          padding="none"
        >
          {row.author_last_education_name}
        </TableCell>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setProgramOpen(!programOpen)}
          >
            {programOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow
                key={6*idx+2}
                >
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
          <Collapse in={programOpen} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Program : {row.author_last_education_name}
              </Typography>
              {
                loadingFields.includes('author_last_education_name') ?
                <LinearProgress /> :
                programInfo
              }
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      <TableRow
                key={6*idx+3}
                >          
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
       <Collapse in={doiOpen} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Publication Metrics : {row.id_pmid ? row.id_pmid : `PMID not found!`}
              </Typography>
              {
                timedout ? <SyncProblemIcon /> : loadingFields.includes('publication_citation_count') ?
                <LinearProgress /> :
                getIciteDisplay(row)
              }              
            </Box>
          </Collapse>
          </TableCell>
      </TableRow>
      <TableRow
                key={6*idx+4}
                >          
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
         <Collapse in={firstAuthorOpen } timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                First Author : {row.author_first_display_name}
              </Typography>
              <AuthorTable
              name={row.author_first_display_name}
              first={true}
              first_author_student={row.first_author_student}
              hindex={row.author_first_hindex}
              citation_count={row.author_first_citation_count}
              paper_count={row.author_first_paper_count}
              getDoximityInfo={getDoximityInfo}
              loadingFields={loadingFields}
              timedout={timedout}
              />              
            </Box>
          </Collapse>
          </TableCell>
      </TableRow>
      <TableRow
                key={6*idx+5}
                >          
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
          <Collapse in={lastAuthorOpen} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
              Last Author : {row.author_last_display_name}
              </Typography>
              <AuthorTable
              name={row.author_last_display_name}
              first={false}
              position_rank={row.author_last_position_rank}
              hindex={row.author_last_hindex}
              citation_count={row.author_last_citation_count}
              paper_count={row.author_last_paper_count}
              getDoximityInfo={getDoximityInfo}
              loadingFields={loadingFields}
              timedout={timedout}
              />
            </Box>
          </Collapse>
          </TableCell>
      </TableRow>
      <TableRow
                key={6*idx}
                >          
      </TableRow>
    </React.Fragment>
  );
}

// Row.propTypes = {
//   row: PropTypes.shape({
//     calories: PropTypes.number.isRequired,
//     carbs: PropTypes.number.isRequired,
//     fat: PropTypes.number.isRequired,
//     history: PropTypes.arrayOf(
//       PropTypes.shape({
//         amount: PropTypes.number.isRequired,
//         customerId: PropTypes.string.isRequired,
//         date: PropTypes.string.isRequired,
//       }),
//     ).isRequired,
//     name: PropTypes.string.isRequired,
//     price: PropTypes.number.isRequired,
//     protein: PropTypes.number.isRequired,
//   }).isRequired,
// };

export default function EnhancedTable(props) {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('program');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(true);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [infoRow, setInfoRow] = React.useState();
  const {rows, columnMetadata, getProgramInfo, doximityUserData} = props;
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.name);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
      return;
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = (event) => {
    setDense(event.target.checked);
  };

  const isSelected = (name) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const visibleRows = React.useMemo(
    () =>
      stableSort(rows, getComparator(order, orderBy)).slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [order, orderBy, page, rowsPerPage, rows],
  );


  const  getDoximityInfo = (name) => {
    return getDoximityMatchedIndividual(doximityUserData, name);
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table
            stickyHeader
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size={dense ? 'small' : 'medium'}
          >
            <EnhancedTableHead
              columnMetadata={columnMetadata}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
              loadingFields={props.loadingFields}
              timedout={props.timedout}
              fetchingExternalData={props.fetchingExternalData}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = isSelected(row.name);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <Row
                  key={index} 
                  idx={index}
                  row={row}
                  programInfo={getProgramInfo(row.author_last_program_id)}
                  getDoximityInfo={getDoximityInfo}
                  loadingFields={props.loadingFields}
                  timedout={props.timedout}
                  columnMetadata={columnMetadata}
                  />
                );
              })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: (dense ? 33 : 53) * emptyRows,
                  }}
                  key={'empty'}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      {/* <FormControlLabel
        control={<Switch checked={dense} onChange={handleChangeDense} />}
        label="Dense padding"
      /> */}
    </Box>
  );
}