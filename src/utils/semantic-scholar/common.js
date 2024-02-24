
export const BASE_URL = 'https://api.semanticscholar.org/graph/v1';


export const PAPER_URL_ROUTE = BASE_URL + '/paper/';
export const AUTHOR_URL_ROUTE = BASE_URL + '/author/';


export const SEMANTIC_API_KEY_HEADER = 'x-api-key';
export const SEMANTIC_API_KEY = 'e7gL5nOqna5RQH7713cdC3DDtgivLtmd4KsSPApR';

export const SEMANTIC_API_HEADERS = {
//   'Content-Type': 'application/json',
//   [SEMANTIC_API_KEY_HEADER]: SEMANTIC_API_KEY
  'x-api-key': SEMANTIC_API_KEY
};
