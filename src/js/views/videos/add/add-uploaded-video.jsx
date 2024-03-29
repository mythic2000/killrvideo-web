import React, { Component, PropTypes } from 'react';
import { reduxForm } from 'redux-form';
import { validateForm } from 'lib/validation';
import { uploadVideo, clearVideoSelection } from 'actions/add-uploaded-video';

import { Alert, Row, Col, ProgressBar, Button } from 'react-bootstrap';
import Dropzone from 'react-dropzone';
import Input from 'components/shared/input';
import Icon from 'components/shared/icon';

// Component for when current browser doesn't support APIs needed for uploading a video
class AddUploadedVideoNotSupported extends Component {
  render() {
    return (
      <Alert bsStyle="danger">
        Sorry, upload is not currently supported by this browser or device.
      </Alert>
    );
  }
}

// Inputs needed to add a new uploaded video
class AddUploadedVideo extends Component {
  handleDropzoneKeys(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.refs.dropzone.open();
      e.preventDefault();
    }
  }
  
  handleDropzoneDrop(files) {
    this.props.fields.uploadFile.onChange(files[0]);
  }
  
  componentDidUpdate(prevProps) {
    // Once we have a valid file, start the upload
    if (prevProps.fields.uploadFile.invalid && this.props.fields.uploadFile.valid) {
      this.props.handleSubmit();
    }
  }
  
  componentWillUnmount() {
    this.props.clearVideoSelection();
  }
  
  doReset() {
    this.props.clearVideoSelection();
    this.props.resetForm();
  }
  
  render() {
    const { fields: { uploadFile }, handleSubmit, statusMessage, statusMessageStyle, percentComplete } = this.props;
    const fileName = uploadFile.valid ? uploadFile.value.name : '';
    
    const resetButton = (
      <Button type="reset" key="reset" title="Reset video selection" onClick={() => this.doReset()}>
        <Icon name="times" title="Reset video selection" />
      </Button>
    );
    
    const retryButton = (
      <Button type="button" key="retry" title="Retry upload" bsStyle="primary" onClick={handleSubmit}>
        <Icon name="refresh" title="Retry upload" />
      </Button>
    );
    
    // If there is an error, include the retry button
    const buttonsAfter = statusMessageStyle === 'danger'
      ? [ resetButton, retryButton ]
      : [ resetButton ];
    
    return (
      <form>
        <Input {...uploadFile} wrapperClassName={uploadFile.valid ? 'hidden' : undefined}>
          <Dropzone multiple={false} tabIndex="0" className="add-video-upload-drop" activeClassName="active" ref="dropzone"
                    onDrop={files => this.handleDropzoneDrop(files)} onFocus={uploadFile.onFocus}
                    onBlur={uploadFile.onBlur} onKeyPress={e => this.handleDropzoneKeys(e)}>
            <div>
              <Icon name="file-video-o" size="4x" /><br/>
              Drag and drop a file to upload<br/>
              <span className="text-muted">Or click to choose a file</span>
            </div>
          </Dropzone>
        </Input>
        <Row className={uploadFile.invalid ? 'hidden' : undefined}>
          <Col xs={12}>
            <Input type="text" label="Video File" value={fileName} buttonAfter={buttonsAfter} disabled />
          </Col>
        </Row>
        <Row className={uploadFile.invalid ? 'hidden' : undefined}>
          <Col xs={12}>
            <span className={`text-${statusMessageStyle} text-uppercase small`}>{statusMessage}</span><br/>
            <ProgressBar now={percentComplete} bsStyle={statusMessageStyle} />
          </Col>
        </Row>
      </form>
    );
  }
}

// Prop validation
AddUploadedVideo.propTypes = {
  // Redux state
  statusMessage: PropTypes.string.isRequired,
  statusMessageStyle: PropTypes.string.isRequired,
  percentComplete: PropTypes.number.isRequired,
  
  // From redux-form
  fields: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  resetForm: PropTypes.func.isRequired,
  
  // Actions
  clearVideoSelection: PropTypes.func.isRequired
};

// Validation constraints
const constraints = {
  uploadFile: {
    presence: { message: '^Please select a video to upload' },
    fileMaxSize: { message: '^Video is too large, please select a smaller video', size: 1073741824 }  // Support uploads of up to 1 GB
  }
};

// Map redux state to props
function mapStateToProps(state) {
  const { addVideo: { upload } } = state;
  return {
    ...upload
  };
}

// Wrap component with redux form
const AddUploadedVideoForm = reduxForm({
  form: 'addUploadedVideo',
  fields: [ 'uploadFile' ],
  validate(vals) {
    return validateForm(vals, constraints);
  }
}, mapStateToProps, { onSubmit: uploadVideo, clearVideoSelection })(AddUploadedVideo);

// Export the appropriate component based on whether upload is supported
const uploadSupported = global.File && global.FileReader && global.FileList && global.Blob;
const exportedComponent = uploadSupported ? AddUploadedVideoForm : AddUploadedVideoNotSupported;
export default exportedComponent;