const request = require('supertest');
const config = require('../../config/config');
const { generateReference } = require('../../data-generator/TestDataGenerator');

const describeIntegration = config.baseUrl ? describe : describe.skip;
const testLogin = config.testUsername && config.testPassword ? test : test.skip;
const testUsernameAvailability = config.testUsername ? test : test.skip;

describeIntegration('CashHub Authentication API', () => {
  test('rejects an unauthenticated request for the current user', async () => {
    const response = await request(config.baseUrl)
      .get('/api/v1/Auth/me')
      .set('Accept', 'application/json');

    expect(response.status).toBe(401);
  });

  testUsernameAvailability('checks availability for the configured test username', async () => {
    const response = await request(config.baseUrl)
      .get('/api/v1/Auth/check-availability')
      .query({ username: config.testUsername })
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.isAvailable).toEqual(expect.any(Boolean));
  });

  testLogin('authenticates the configured test user and verifies the returned JWT', async () => {
    const response = await request(config.baseUrl)
      .post('/api/v1/Auth/login')
      .set('Accept', 'application/json')
      .send({
        username: config.testUsername,
        password: config.testPassword,
        deviceFingerprint: generateReference('cashhub-test'),
        rememberMe: false
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('nextStep');

    if (response.body.accessToken) {
      const currentUser = await request(config.baseUrl)
        .get('/api/v1/Auth/me')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${response.body.accessToken}`);

      expect(currentUser.status).toBe(200);
      expect(currentUser.body.accountId).toBeTruthy();
      expect(currentUser.body.username).toBe(config.testUsername);
      return;
    }

    expect(response.body.sessionToken).toBeTruthy();
    expect(response.body.otpChannel).toBeTruthy();
    expect(response.body.otpExpiresIn).toEqual(expect.any(Number));
  });
});
