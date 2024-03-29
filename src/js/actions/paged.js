import { createAction } from 'redux-actions';
import model from 'stores/falcor-model';
import { isUndefined, values } from 'lodash';

/**
 * Paging action constants
 */

export const RESET = 'paged/RESET';
export const REQUEST = 'paged/REQUEST';
export const RECEIVE = 'paged/RECEIVE';
export const CHANGE_PAGE = 'paged/CHANGE_PAGE';

/**
 * Private action creators
 */

function request(listId) {
  return {
    type: `paged/${listId}/REQUEST`,
    payload: {
      pagedType: REQUEST,
      listId
    }
  };
}

function receive(listId, data, moreDataOnServer, queryModel) {
  return {
    type: `paged/${listId}/RECEIVE`,
    payload: {
      pagedType: RECEIVE,
      listId,
      data,
      moreDataOnServer,
      queryModel
    }
  };
}

function changePage(listId, currentPageIndex) {
  return {
    type: `paged/${listId}/CHANGE_PAGE`,
    payload: {
      pagedType: CHANGE_PAGE,
      listId,
      currentPageIndex
    }
  };
}

function reset(listId) {
  return {
    type: `paged/${listId}/RESET`,
    payload: {
      pagedType: RESET,
      listId
    }
  };
}

/**
 * Private action creators that are exported as part of the public API by the createPagedActions function.
 */

// Action to get the initial page of records in a list using falcor
function getInitialPage(selectPagedState, queryRoot, queries) {
  return (dispatch, getState) => {
    let { _listId: listId, pagingConfig } = selectPagedState(getState());
    
    // Reset any existing state
    dispatch(reset(listId));
        
    // Tell the UI we're loading
    dispatch(request(listId));
    
    // Add paging range to queries
    queries = queries.map(q => [ { from: 0, length: pagingConfig.recordsPerPage }, ...q ]);
    
    let queryModel = null;
    model.deref(queryRoot, ...queries)
      .subscribe(
        m => { queryModel = m; },
        null, // TODO: Error handler?
        () => {
          // Possible to have null for the query model if no results were found
          if (queryModel === null) {
            dispatch(receive(listId, [], false, null));
            return;
          }
          
          queryModel.get(...queries).then(response => {
            const data = isUndefined(response) ? [] : values(response.json);
            const moreDataOnServer = data.length === pagingConfig.recordsPerPage;
            dispatch(receive(listId, data, moreDataOnServer, queryModel));
          });
        }
      );
  };
};

// Go to the next page of records in the list
function nextPageClick(selectPagedState, queries) {
  return (dispatch, getState) => {
    // Grab some of the current state
    let { _listId: listId, _queryModel: queryModel, moreDataOnServer, data, currentPageIndex, pagingConfig } = selectPagedState(getState());
    
    const nextPageStartIdx = currentPageIndex + pagingConfig.incrementIndexPerPage;
    const alreadyHaveSomeOfNextPage = data.length > nextPageStartIdx;
    
    // If no data on the server and no data on the next page available, just bail and do nothing
    if (moreDataOnServer === false) {
      if (alreadyHaveSomeOfNextPage === false) {
        return;
      }
      
      // No data on server, but some records to show so go to the next page
      dispatch(changePage(listId, nextPageStartIdx));
      return;
    }
    
    // Do we have the full next page to show without going to the server?
    const nextPageEndIdx = nextPageStartIdx + pagingConfig.recordsPerPage - 1;
    if (nextPageEndIdx < data.length) {
      dispatch(changePage(listId, nextPageStartIdx));
      return;
    }
    
    // There are more pages available on the server and we need them, so go get them then go to the next page
    dispatch(request(listId));
    
    queries = queries.map(q => [ { from: data.length, length: pagingConfig.recordsPerRequest }, ...q ]);
    queryModel.get(...queries).then(response => {
      const newData = isUndefined(response) ? [] : values(response.json);
      const moreDataAvailable = newData.length === pagingConfig.recordsPerRequest;
      dispatch(receive(listId, newData, moreDataAvailable));
      
      // If we got an empty page of data, make sure we actually have data on the next page to show
      if (newData.length === 0 && alreadyHaveSomeOfNextPage === false) {
        return;
      }
      
      dispatch(changePage(listId, nextPageStartIdx));
    });
  };
};

// Go to the previous page of records in the list
function previousPageClick(selectPagedState) {
  return (dispatch, getState) => {
    let { _listId: listId, currentPageIndex, pagingConfig } = selectPagedState(getState());
    
    if (currentPageIndex === 0) return;
    dispatch(changePage(listId, currentPageIndex - pagingConfig.incrementIndexPerPage));
  };
};

// Reset state when unloaded
function unload(selectPagedState) {
  return (dispatch, getState) => {
    let { _listId: listId } = selectPagedState(getState());
    dispatch(reset(listId));
  };
}


/**
 * Function for creating an object with the actions bound to a given list/paging config. The listId
 * should uniquely identify a list. The selectPagedState function should take one parameter (the current 
 * state from redux) and return the part of the state tree where the list's reducer is mounted.
 */
export function createPagedActions(selectPagedState) {
  // Return an object with the public API's actions  
  return {
    getInitialPage(queryRoot, queries) {
      return getInitialPage(selectPagedState, queryRoot, queries);
    },
    
    nextPageClick(queries) {
      return nextPageClick(selectPagedState, queries);
    },
    
    previousPageClick() {
      return previousPageClick(selectPagedState);
    },
    
    unload() {
      return unload(selectPagedState);
    }
  };
};