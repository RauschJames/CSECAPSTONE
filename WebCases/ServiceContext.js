//James Rausch
//Jest mockup code
// Mock setup for fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ body: JSON.stringify([...]) }),
  })
);

// Utility to reset mocks before each test
beforeEach(() => {
  fetch.mockClear();
});
//TEST FETCHBUCKETDATA
describe('fetchBucketData', () => {

  
  it('successfully fetches data', async () => {
    // Setup
    const mockData = { bucket_name: 'testBucket', bucket_owner_id: '123', bucket_owner_role: 'admin' };//NEED TO INPUT OUR OWN TEST DATA
    const expectedUrl = `https://kyr5dc3n5f.execute-api.us-west-2.amazonaws.com/test/getBucketData?bucket=${mockData.bucket_name}&account=${mockData.bucket_owner_id}&role=${mockData.bucket_owner_role}`;
    const responseData = [{}, {}]; // Expected response data structure
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ body: JSON.stringify(responseData) }),
      })
    );

    // Execute
    await fetchBucketData(mockData);

    // Validate
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expectedUrl);
  
  });

  it('handles fetch failure', async () => {
    // Setup
    fetch.mockImplementationOnce(() => Promise.reject('API failure'));

    // Execute & Validate
    await expect(fetchBucketData({})).rejects.toMatch('API failure');

  });
});
describe('showPopup', () => {
  // Setup HTML fixture
  document.body.innerHTML = `
    <div class="overlay"></div>
    <div id="popup"></div>
  `;

  it('displays popup correctly', () => {
    // Setup
    const itemSrc = 'http://example.com';
    
    // Execute
    showPopup(itemSrc);
    
    // Validate
    const popup = document.getElementById('popup');
    expect(popup.style.display).toBe('block');
    expect(popup.innerHTML).toContain(itemSrc);
  });
});
