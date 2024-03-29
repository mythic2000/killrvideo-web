import React, { Component, PropTypes } from 'react';
import { Row, Col } from 'react-bootstrap';
import { range } from 'lodash';
import classNames from 'classnames';

// An individual star component for use in the VideoRatingSharing component below
class StarRating extends Component {
  render() {
    const starClasses = classNames({
      'star': true,
      'filled': this.props.currentRating >= this.props.starValue,
      'highlighted': this.props.proposedRating >= this.props.starValue
    });
    const { onClick, onMouseOver, onMouseOut } = this.props;
    return (
      <span className={starClasses} onMouseOver={onMouseOver} onMouseOut={onMouseOut} onClick={onClick}></span>
    );
  }
}

// Prop validation
StarRating.propTypes = {
  starValue: PropTypes.number.isRequired,
  currentRating: PropTypes.number.isRequired,
  proposedRating: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  onMouseOver: PropTypes.func.isRequired,
  onMouseOut: PropTypes.func.isRequired
};

// Component for the Video Rating and Sharing row on the view video page
class VideoRatingSharing extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      proposedRating: 0
    };
  }
  
  proposeRating(rating) {
    if (this.props.ratingEnabled) {
      this.setState({ proposedRating: rating });
    }
  }

  rate(rating) {
    // TODO: Record ratings
    console.log('Rated ' + rating);
  }
  
  getStar(starValue, currentRating) {
    return (
      <StarRating starValue={starValue} currentRating={currentRating} proposedRating={this.state.proposedRating}
                  onMouseOver={e => this.proposeRating(starValue)} onMouseOut={e => this.proposeRating(0)}
                  onClick={e => this.rate(starValue)} key={starValue} />
    );
  }
  
  render() {
    const averageRating = this.props.video.rating
      ? (this.props.video.rating.total / this.props.video.rating.count)
      : 0;
      
    const ratingClasses = classNames({
      'video-rating': true,
      'video-rating-enabled': this.props.ratingEnabled
    });
    
    return (
      <Row className="video-rating-and-sharing">
        <Col xs={2} sm={4}>
          <div className="video-rating-average">
            <div>
              <h4>{averageRating.toFixed(1)}</h4>
              <span className="hidden-xs">overall</span><br className="hidden-xs" /><span className="hidden-xs">rating</span>
            </div>
          </div>
        </Col>
        <Col xs={6} sm={5}>
          <div className="video-rating-stars">
            <span className={ratingClasses}>
              {range(1, 6).map(starValue => this.getStar(starValue, averageRating))}
            </span>
          </div>
        </Col>
        <Col xs={4} sm={3}>
          <div className="video-rating-share">
            <a className="btn btn-block btn-link">
              Share <span className="caret"></span>
            </a>
          </div>
        </Col>
      </Row>
    );
  }
}

// Falcor queries for the component
VideoRatingSharing.queries = {
  video() {
    return [
      [ 'rating', [ 'count', 'total' ] ]
    ];
  }
};

// Prop validation
VideoRatingSharing.propTypes = {
  video: PropTypes.object.isRequired,
  ratingEnabled: PropTypes.bool.isRequired
};

export default VideoRatingSharing;