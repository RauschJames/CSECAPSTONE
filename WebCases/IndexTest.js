// James Rausch
//Index Jest Testing

// Setup global fetch mock
global.fetch = jest.fn();

beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';
  // Reset fetch mock
  fetch.mockClear();
});

describe('AWS Service Explorer Functionality Tests', () => {
  it('shows popup with correct server information', () => {
    // Setup
    const server = { BucketName: 'TestBucket', ARN: 'arn:aws:testbucket', REGION: 'us-east-1' };
    showPopup(server);

    const popup = document.getElementById("popup");
    const serverInfo = document.getElementById("serverInfo").innerHTML;

    // Assertions
    expect(popup.style.display).toBe("flex");
    expect(serverInfo).toContain(server.BucketName);
    expect(serverInfo).toContain(server.ARN);
    expect(serverInfo).toContain(server.REGION);
  });

  it('adds server and displays it in the UI', async () => {
    // Mock fetch response for adding server
    fetch.mockImplementationOnce(() => Promise.resolve({ json: () => Promise.resolve({ message: "Server added" }) }));
    
    // Trigger server addition
    const serverName = "NewServer";
    addServerToUI(serverName); 

    const serviceGridContent = document.getElementById('serviceGrid').textContent;
    expect(serviceGridContent).toContain(serverName);
    expect(fetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ method: 'POST' }));
  });

  it('updates displayed servers on region selection', () => {
  
  it('closes popup correctly', () => {
    const popup = document.getElementById('addServerPopup');
    popup.style.display = 'block';

    document.getElementById('closeAddServerPopup').click();

    expect(popup.style.display).toBe('none');
  });

  it('logs out and redirects user', async () => {

    fetch.mockImplementationOnce(() => Promise.resolve({ redirected: true, url: '/login' }));
    await performLogout();
    expect(fetch).toHaveBeenCalledWith('/logout', expect.objectContaining({ method: 'POST' }));
  });
});
