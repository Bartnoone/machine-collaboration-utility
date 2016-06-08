/* global describe, it */
const should = require(`should`);
const request = require(`request-promise`);
const fs = require(`fs-promise`);
const path = require(`path`);
const Promise = require(`bluebird`);

module.exports = function toDoListTests() {
  let jobUuid;
  let fileUuid;
  describe('UI unit test', function () {
    it('should upload an escher file', async function (done) {
      const escherFilePath = path.join(__dirname, `conductor-test.zip`);
      const fileStream = await fs.createReadStream(escherFilePath);
      const formData = { file: fileStream };
      const fileParams = {
        method: `POST`,
        uri: `http://localhost:9000/v1/files`,
        formData,
        json: true,
      };
      const uploadFileReply = await request(fileParams);
      should(uploadFileReply.status).equal(200);
      should(uploadFileReply.query).equal(`Upload File`);
      fileUuid = uploadFileReply.data[0].uuid;
      done();
    });
    it('should create a conductor job', async function (done) {
      const requestParams = {
        body: { botId: -1 },
        method: `POST`,
        uri: `http://localhost:9000/v1/jobs/`,
        json: true,
      };
      const jobCreateReply = await request(requestParams);
      const job = jobCreateReply.data;
      should(!!job.uuid);
      should(!!job.state);
      jobUuid = job.uuid;
      should(jobCreateReply.status).equal(201);
      should(jobCreateReply.query).equal(`Create Job`);
      done();
    });
    it('should link the file to the conductor job', async function (done) {
      const setFileToJobParams = {
        method: `POST`,
        uri: `http://localhost:9000/v1/jobs/${jobUuid}/setFile`,
        body: { fileUuid },
        json: true,
      };
      try {
        const setFileToJobReply = await request(setFileToJobParams);
        should(setFileToJobReply.status).equal(200);
        should(setFileToJobReply.query).equal(`Set File to Job`);
        done();
      } catch (ex) {
        console.log('flailboat', ex);
      }
    });
    it('should connect the conductor', async function (done) {
      const requestParams = {
        body: {
          command: `connect`,
        },
        method: `POST`,
        uri: `http://localhost:9000/v1/conductor`,
        json: true,
      };
      const conductorCommandReply = await request(requestParams);
      console.log('conductor reply', conductorCommandReply);
      done();
    });
    it('should see a connected conductor after 5 seconds', async function (done) {
      this.timeout(5000);
      await Promise.delay(4000);
      const requestParams = {
        method: `GET`,
        uri: `http://localhost:9000/v1/conductor`,
        json: true,
      };
      const conductorStatus = await request(requestParams);
      console.log('conductor reply', conductorStatus);
      done();
    });
    it('should start the job', async function (done) {
      this.timeout(10000);
      const setFileToJobParams = {
        method: `POST`,
        uri: `http://localhost:9000/v1/jobs/${jobUuid}`,
        body: {
          command: `start`,
        },
        json: true,
      };
      try {
        const jobCommandReply = await request(setFileToJobParams);
        console.log('job command reply', jobCommandReply);
      } catch (ex) {
        console.log('flailboat', ex);
      }
      await Promise.delay(9000);
      done();
    });
  });
};