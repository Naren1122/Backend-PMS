class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400; // if statusCode is less than 400, it means the request was successful else it gives false for example in our controller i kept status code 204 so success true
  }
}
export { ApiResponse };
