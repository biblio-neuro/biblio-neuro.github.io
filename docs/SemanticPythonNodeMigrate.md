# Plan to migrate PyAlex to Node OpenAlex

## OpenAlex Publication Data : Raw, then Simplify
 - [x] prepare the base openalex api with required filters
    ```js
    https://api.openalex.org/works?filter=from_publication_date:2013-01-01,
                authorships.institutions.country_code:US,
                primary_location.source.type:journal,
                is_paratext:false,
                raw_affiliation_string.search:neurosurgery
                &sort=publication_year:desc
                &per-page=200
    ```
 - [x] Call the above api as many times as a valid cursor (`response.meta.next_cursor`) is returned in the response, using it for the next call.
    - First call: `base_url&cursor=*`
 - [x] Decide if you want to save the above results into a file
 - [x] Extract new fields for convenience
    - [x] Identifier fields
        ```js
        response.ids : {'openalex': 'https://openalex.org/W4306730981',
                    'doi': 'https://doi.org/10.4103/1673-5374.355749',
                    'pmid': 'https://pubmed.ncbi.nlm.nih.gov/36254972'
                    }
        ```
    - [x] Primary Location (`depricated` : `host_venue`)
        ```js
        response.primary_location : { ...
        'source': {
            'id': 'https://openalex.org/S80372421',
            'display_name': 'Neural Regeneration Research',
            'issn_l': '1673-5374',
            'is_oa': True,
            'type': 'journal'
            ...
        },
        }
        ```
    - [x] Authorships 
        ```js
        [
            {
            'author_position': 'first',
            'author': {'id': 'https://openalex.org/A4316358452',
            'display_name': 'Jonathan J Halford',
            'orcid': None},
            'institutions': [{'id': 'https://openalex.org/I153297377',
                'display_name': 'Medical University of South Carolina',
                'ror': 'https://ror.org/012jban78',
                'country_code': 'US',
                'type': 'education'}],
            'raw_affiliation_string': 'Department of Neurology .. '
            }
        ]
        ```
         - Collect the following fields, per author position
        ```js
        author_positions = ["first", "last"]
        for field in author_info_foi = ["id", "display_name", "orcid", "raw_affiliation_string"]:
            author_${position}_${field}
        for field in author_inst_info_foi = ["id", "display_name", "type"]
            author_${position}_institution_${field}
        ```
        - If multiple values for a given author, concat with `|`

    > Validation for all the above :
    `GET https://API_SERVER/pubs-sample` should return:

    ```json
    {
        "data": [
            {
                "id": "https://openalex.org/W4365791186",
                "title": "Mesenchymal stem cell-derived extracellular vesicles as a cell-free therapy for traumatic brain injury via neuroprotection and neurorestoration",
                "publication_date": "2024-01-01",
                "id_openalex": "https://openalex.org/W4365791186",
                "id_doi": "https://doi.org/10.4103/1673-5374.374143",
                "id_pmid": "https://pubmed.ncbi.nlm.nih.gov/37488843",
                "author_first_id": "https://openalex.org/A5049580087",
                "author_first_display_name": "Yue Xiong",
                "author_first_orcid": "https://orcid.org/0000-0003-2744-6566",
                "author_first_raw_affiliation_string": "Department of Neurosurgery, Henry Ford Hospital, Detroit, MI, USA",
                "author_first_institution_id": "https://openalex.org/I2803043754",
                "author_first_institution_display_name": "Henry Ford Hospital",
                "author_first_institution_type": "healthcare",
                "author_last_id": "https://openalex.org/A5005508444",
                "author_last_display_name": "Michael Chopp",
                "author_last_orcid": "https://orcid.org/0000-0002-1948-4493",
                "author_last_raw_affiliation_string": "Department of Neurology, Henry Ford Hospital, Detroit, MI, USA; Department of Physics, Oakland University, Rochester, MI, USA",
                "author_last_institution_id": "https://openalex.org/I2803043754;https://openalex.org/I177721651",
                "author_last_institution_display_name": "Henry Ford Hospital;Oakland University",
                "author_last_institution_type": "healthcare;education"
            },
            {/*...*/},
        ],
    "message": "Status is success, but timestamp is within a week." //similar status about recency
    }
    ```

 ## Manually collected Faculty, Fellow, Residents data - Google Sheets

  - OLD: Current code, sheet name `all_fac_fel_res`
  - NEW: New sheet, each of `Faculty`, `Fellow`, `Resident` is a different sheet
    - [ ] TODO: Migrate OLD to NEW. For now, use the output of OLD as it is provides the fields needed
  - [x] Check if the ranks are standardized
  - [x] Check if the duplicates are resolved
    - [x] Special resolving rules for `edu level` and `PGY_#` (choose faculty > fellow > resident and max PGY)
    - [x] Rest all - `|` separated concatenation
  - [x] Estimate year of graduation for residents

## Manually collected Program data
  - [x] Old data file for main joining with individuals:
    - [x] AAMC sheet
    - [x] Residency Explorer sheet
  - [x] More recent google sheet with lot more data points
    - mostly used in the tool for export than preprocessing
  - [ ] Combine excel sheet to have all program sheets at one place
  - [ ] Refactor program code all in one place for easier modifications later

## Join Individuals and Program data
  - [x] Join Individuals and programs, at least to replicate the python version

## Join Publication data with Individuals and Program Data
 - [x] Define match - strict and loose
 - [x] Extract first author matches
 - [x] Extract last author matches
 - [x] Combine all pubs with either first or last author matches

