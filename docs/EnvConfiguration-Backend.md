# EnvConfiguration-Backend

In the backend project, hosted on `glitch` , there is a file named `.env`. 

This is nothing specific to `glitch` as hosting service but a common practice in development to have some important configurations of the tool such as credentials for example stored in a file that is outside the actual code of the project. This way we can control some parameters without restarting the tool or some times, possibly restarting but not having to change the code in the tool.

> Any changes to the values in the `.env` file, it is recommended that the server has to be restarted (with no code changes). However, at the moment, `Glitch` takes care of auto-restart of the server when any value is changed.  

In the case of our backend project [`bn-backend-glitch`](https://github.com/biblio-neuro/bn-backend-glitch) , we maintain some variables in the `.env` file of the project. Importantly, the real values that are to be used by the tool are usually not checked into the repository, especially not when the repository is public.

## Variables in .env of bibliometric-tool backend

At the moment the tool depends on `.env` file for variables related to the following
 - Google Sheets
 - Semantic Scholar API related download parameters
 - The tool Admin passkey for some sensitive operations like resetting all the data
### Google sheets
The tool depends on multiple Google Sheets for data - Neurosurgery Programs information, Individuals (Residents, Fellows and Faculty)  information at the moment. 

To access any Google related services through APIs programmatically, we need Google's API Key for a certain google account which manages all the sheets. In the case of this tool, everything is managed under the Google account  `bibliotools.neuro@gmail.com`. So one of the first variables in the `.env` file is `GOOGLE_API_KEY`

#### GOOGLE_API_KEY
Currently the value can be found as described in the other document. 

To access any google sheets programmatically (from code rather than opening a sheet in the browser), we need to use Google's Sheets API where we use the `SHEET_ID` and the name of the specific sheet that we want to access. Consider the following google sheets link as seen in your browser, that has Individuals data:
```
https://docs.google.com/spreadsheets/d/1K2JJG6uSl3tdisN4xtBnIHwqUOo5BGWeTH1I0rXF-L8/edit#gid=0
```
In the link above the `string` between `spreadsheets/d/` and `/edit` is the `SHEET_ID` , which is `1K2JJG6uSl3tdisN4xtBnIHwqUOo5BGWeTH1I0rXF-L8` in this case. This `SHEET_ID` has to be provided when using Google Sheets API to access the data from this spreadsheet.

> NOTE 1: As you can see in this spreadsheet, there are different sheets of data by names `Faculty`, `Residents` and `Fellows`. To access each of these different sheets, the code uses these sheet names EXACTLY. So it is required that these names don't change and in case they do, they need to be updated in the code as well. The same applies to the first row which has the `Field Names`.  

> NOTE 2:  For instance, an innocent change in the field name from `Degree(s)` to `Degrees` could break the code. 

Currently there are 2 Google Spreadsheets being used, one for the Programs and the other for the Individuals. 
#### GSHEET_PROGRAMDETAILS_SHEET_ID

Currently, this is not the 'latest' file as the latest file has some problems with inconsistencies such as empty rows in the data. The tool currently points to 
`GSHEET_PROGRAMDETAILS_SHEET_ID='1PqgrFDWeL56yjoijkZUtyT26J7n-U7yz8f3tY1EOeYA'`

Ideally the sheet we would want to use is [FREIDA-prog-list-scrap](https://docs.google.com/spreadsheets/d/1poacmUT_2TM00nZ8agOIZFP_dILEd_LLoZbqjOkWFqE/edit#gid=0) whose `SHEET_ID` is `1poacmUT_2TM00nZ8agOIZFP_dILEd_LLoZbqjOkWFqE`. Once this sheet is corrected for the problems, the variable above can be changed to `GSHEET_PROGRAMDETAILS_SHEET_ID='1poacmUT_2TM00nZ8agOIZFP_dILEd_LLoZbqjOkWFqE'` 
(Or comment the previous line with a `#` at the beginning of the link and uncomment this line which is already commented in the `.env` file)

#### GSHEET_INDIVIDUALDETAILS_SHEET_ID

Currently this value points to the correct sheet : [US Neurosurgery Residents, Fellows, Faculty 2023-2024](https://docs.google.com/spreadsheets/d/1K2JJG6uSl3tdisN4xtBnIHwqUOo5BGWeTH1I0rXF-L8/edit#gid=0)
```
GSHEET_INDIVIDUALDETAILS_SHEET_ID='1K2JJG6uSl3tdisN4xtBnIHwqUOo5BGWeTH1I0rXF-L8'
```
Upon any changes to this file - location, permissions, migrate, sheet name change, field name changes - it has to be made sure that the sheet id is updated here and code changes are made for any sheet name or field name changes.

### Semantic Scholar API

There are several parameters provided to access the Semantic Scholar APIs. The most important ones that give the tool control over the restrictions related to the amount of data it downloads are the following :

#### SEMANTIC_PUBS_PER_PAGE
`SEMANTIC_PUBS_PER_PAGE=150`

Currently, the value is set to `150` . That is in a given API call to semantic scholar, the tool downloads `150` publications. There is no reason not to increase this to `200`, `500` or even `1000` except the hardware capabilities of the server where the tool is hosted. Each publication data varies with the number of authors. At this moment, since the tool is hosted on `Glitch Free Tier` any number more than `200` publications is stretching the memory limits of the server - that is to hold all of them in memory while the tool processes each of the publication for relevant information.  

#### SEMANTIC_PUBS_START_DATE
`SEMANTIC_PUBS_START_DATE='2023-01-01'`

This is the start date from which the Semantic Scholar would return the publication _since_.
At the moment it is `2023-01-01` because of the first configuration after all the accounts migration, not to overload the system while testing. Ideally if the tool wants to display information from the year `2013`, this is the parameter that needs to be changed, in the format `yyyy-MM-DD`.

### Tool Admin

At the moment, the API services of the tool's backend returns data for anyone who requests. It is not a major concern at this point. However, as the tool grows, one would want to restrict the requests to the backend either by authorized users or certain domains. Instead of introducing an entire `user accounts` system, at this point, a simple pass key is checked. At the moment, the pass key is actually the subdomain name where `glitch` has hosted this very backend tool.

#### REFRESH_ALL_DATA_PASSKEY
`REFRESH_ALL_DATA_PASSKEY='busy-laced-haircut'`

This current version of the backend project, is hosted by `glitch` at `https://busy-laced-haircut.glitch.me` and this is where the frontend of the tool, `biblio-neuro.github.io`,  requests for all the data. It doesn't mean that whenever a much newer Github backend project is imported to a new `glitch` project, meaning the project will receive a new subdomain url - `https://some-new-subdomain.glitch.me`, that this `REFRESH_ALL_DATA_PASSKEY` has to be changed. This value can be any phrase of choice, preferably secure, but it has to be noted that the frontend code has to be updated whenever this value changes.

