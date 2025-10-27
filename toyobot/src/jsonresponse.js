export class JsonResponse extends Response {
    constructor(body, init = {}) {
      console.log('JsonResponse constructor - raw body:', JSON.stringify(body));
      const jsonBody = JSON.stringify(body);
      
      // Create explicit headers
      const responseInit = {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        }
      };
      
      console.log('JsonResponse constructor - using init:', JSON.stringify(responseInit));
      super(jsonBody, responseInit);
      
      // Log actual headers after construction
      const finalHeaders = {};
      for (const [key, value] of this.headers) {
        finalHeaders[key] = value;
      }
      console.log('Final response headers:', JSON.stringify(finalHeaders));
    }
  }