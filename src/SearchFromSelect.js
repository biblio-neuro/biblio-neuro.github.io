import * as React from 'react';
import {TextField, Toolbar} from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

const filter = createFilterOptions();

export default function FreeSoloCreateOption(props) {
  const {initialValue, onSelect, options} = props;
  const [value, setValue] = React.useState(null);


  const handleSelect = (value) => {
    setValue(value);
    onSelect(value);
  }

  return (
    <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          flex: '1 1 100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
    <Autocomplete
      value={value}
      onChange={(event, newValue) => {
        if (typeof newValue === 'string') {
          handleSelect({
            name: newValue,
          });
        } else if (newValue && newValue.inputValue) {
          // Create a new value from the user input
          handleSelect({
            name: newValue.inputValue,
          });
        } else {
          handleSelect(newValue);
        }
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = options.some((option) => inputValue === option.name);
        if (inputValue !== '' && !isExisting) {
          // filtered.push({
          //   inputValue,
          //   name: `Add "${inputValue}"`,
          // });
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      id="program-search"
      options={options}
      getOptionLabel={(option) => {
        // Value selected with enter, right from the input
        if (typeof option === 'string') {
          return option;
        }
        // Add "xxx" option created dynamically
        if (option.inputValue) {
          return option.inputValue;
        }
        // Regular option
        return option.name;
      }}
      renderOption={(props, option) => <li {...props}>{option.name}</li>}
      sx={{ width: 300}}
      freeSolo
      renderInput={(params) => (
        <TextField {...params} label="Program search" />
      )}
    />
    </Toolbar>      
);
}
