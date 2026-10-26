const request = require('supertest');
const { ADMIN, STATUS } = require('../../../test-data/constants');
const { getRequestHeaders } = require('../../../utilities/api');

let baseUrl = process.env.BASE_URL;
if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';

const terminalRef = process.env.CASHHUB_TEST_PARAM_TERMINAL_REF;
const physicalTid = process.env.CASHHUB_TEST_DATA_PHYSICAL_TID;
const serialNumber = process.env.CASHHUB_TEST_DATA_SERIAL_NUMBER;

describe('Admin - Corrects a device\'s details, or moves it between AVAILABLE and DAMAGED', function() {

  describe('Happy Path', function() {

    test('should return 200 from PUT /api/v1/admin/pos/terminals/available/{terminal-ref}', async function() {
      const response = await request(baseUrl)
        .put(ADMIN.PUT_POS_TERMINALS_AVAILABLE_BY_TERMINAL_REF(terminalRef))
        .set(getRequestHeaders())
        .send({
          physicalTid: physicalTid,
          serialNumber: serialNumber,
          availability: 'AVAILABLE'
        });

      expect(response.status).toBe(STATUS.OK);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual(expect.anything());
      expect(response.body).toHaveProperty('item');
      expect(response.body).toHaveProperty('message');
    });

  });

  describe('Negative Cases - Not Found', function() {

    test('should return 404 when the resource does not exist', async function() {
      const response = await request(baseUrl)
        .put(ADMIN.PUT_POS_TERMINALS_AVAILABLE_BY_TERMINAL_REF('00000000-0000-0000-0000-000000000000'))
        .set(getRequestHeaders())
        .send({
          physicalTid: physicalTid,
          serialNumber: serialNumber,
          availability: 'AVAILABLE'
        });

      expect(response.status).toBe(STATUS.NOT_FOUND);
    });

  });

});
