import { createAction } from 'redux-actions';
import model from 'stores/falcor-model';
import { isUndefined } from 'lodash';

import { createPagedActions } from './paged';

/**
 * Action type constants
 */

export const RESET_USER = 'accountInfo/RESET_USER';
export const REQUEST_USER = 'accountInfo/REQUEST_USER';
export const RECEIVE_USER = 'accountInfo/RECEIVE_USER';

/**
 * Private action creators
 */

const resetUser = createAction(RESET_USER);
const requestUser = createAction(REQUEST_USER);
const receiveUser = createAction(RECEIVE_USER, user => ({ user }));

const comments = createPagedActions(state => state.accountInfo.comments);
const videos = createPagedActions(state => state.accountInfo.videos);

/**
 * Public action creators
 */

// Initial load of data for a user
export function load(userId, userQueries, commentsQueries, previewsQueries) {
  return dispatch => {
    const queryRoot = isUndefined(userId) ? [ 'currentUser' ] : [ 'usersById', userId ];
    const userSelector = isUndefined(userId) 
      ? response => response.json.currentUser 
      : response => response.json.usersById[userId];
    
    // Get user info
    dispatch(requestUser());
    
    userQueries = userQueries.map(q => [ ...queryRoot, ...q ]);
    model.get(...userQueries).then(response => {
      const user = isUndefined(response) ? undefined : userSelector(response);
      dispatch(receiveUser(user));
    });
    
    // Get user comments
    dispatch(comments.getInitialPage([ ...queryRoot, 'comments' ], commentsQueries));
    
    // Get user videos
    dispatch(videos.getInitialPage([ ...queryRoot, 'videos' ], previewsQueries));
  };
};

// Showing more comments
export const showMoreComments = comments.nextPageClick;

// Going to the next page of user videos
export const videosNextPage = videos.nextPageClick;

// Going to the previous page of user videos
export const videosPreviousPage = videos.previousPageClick;

// When unloading, just reset the state
export function unload() {
  return dispatch => {
    dispatch(resetUser());
    dispatch(comments.unload());
    dispatch(videos.unload());
  };
};