interface ApiType {statusCode: number, data?: any, message?: string}

class ApiResponse {
    statusCode: number;
    data?: any;
    message: string;
    success: boolean;

    constructor({statusCode, data, message = "Success"}: ApiType){ 
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export { ApiResponse }