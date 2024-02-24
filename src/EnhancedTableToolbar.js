import {Toolbar, Typography, Tooltip, IconButton} from '@mui/material';
import { Delete as DeleteIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import PropTypes from 'prop-types';
import {FormControl, InputLabel, Select, MenuItem} from '@mui/material'

const arrayRange = (start, stop, step) =>
    Array.from(
    { length: (stop - start) / step + 1 },
    (value, index) => start + index * step
    );

function EnhancedTableToolbar(props) {
    const { startYear, year, handleYearChange } = props;
  
    return (
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(startYear < 0 && {
            bgcolor: (theme) =>
              alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
          }),
          flex: '1 1 100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {startYear > new Date().getFullYear() ? (
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="red"
            variant="subtitle1"
            component="div"
          >
            Invalid year : {startYear} 
          </Typography>
        ) : (<>
          <Typography
            // sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            Publications since
          </Typography>
          <FormControl sx={{padding: '5px'}}>
                  <InputLabel id="demo-simple-select-label">Year</InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    sx={{ color: 'inherit', borderColor: '#80bdff', border: '1px solid #ced4da',}}
                    id="demo-simple-select"
                    value={year}
                    label="Year"
                    onChange={handleYearChange}
                  >
                      {
                      arrayRange(startYear, new Date().getFullYear(), 1).map((year) => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))
                      }
                  </Select>
                </FormControl></>
        )}
  
        {/* {startYear > 0 ? (
          <Tooltip title="Delete">
            <IconButton>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )} */}
      </Toolbar>
    );
  }
  
  EnhancedTableToolbar.propTypes = {
    startYear: PropTypes.number.isRequired,
    handleYearChange: PropTypes.func.isRequired
  };

  export default EnhancedTableToolbar;