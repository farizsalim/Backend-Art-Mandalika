const request = require('supertest');
const app = require('./index');
const apihash = process.env.apihash;

describe('Art Mandalika Backend API', () => {
  // Pastikan `apihash` sudah tersedia
  if (!apihash) {
    throw new Error("apihash tidak diatur dalam environment variables.");
  }

  it('should render the index page', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Art Mandalika Backend');
  });

  it('should return 403 for auth route (unauthorized)', async () => {
    const response = await request(app).get(`/${apihash}/api/auth/users`);
    expect(response.statusCode).toBe(403); // Sesuaikan jika perlu autentikasi
  });

  it('should return 200 for artwork route (with data)', async () => {
    const response = await request(app).get(`/${apihash}/api/artwork/data`);
    expect(response.statusCode).toBe(200);
  });

  // Pengujian singkat untuk beberapa route lainnya
  const routes = [
    'artwork',
    'conversation',
    'artrequestartwork',
    'addressapi',
    'order',
    'shipment',
    'midtrans',
    'review'
  ];

  routes.forEach(route => {
    it(`should test ${route} route`, async () => {
      const response = await request(app).get(`/${apihash}/api/${route}`);
      expect([200, 404]).toContain(response.statusCode); // Uji status dasar
    });
  });
});
